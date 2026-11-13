<?php
/**
 * Intégration API MaishaPay - Dépôts Automatiques Mobile Money
 * Airtel Money, Vodacom M-Pesa, Orange Money, Africell Money
 * 
 * Basé sur l'API officielle MaishaPay REST v1.0 & v2.0
 */

require_once __DIR__ . '/config.php';

// Définition des constantes MaishaPay si non définies
if (!defined('MAISHAPAY_MODE')) {
    define('MAISHAPAY_MODE', (int) (getenv('MAISHAPAY_MODE') !== false ? getenv('MAISHAPAY_MODE') : 0));
}
if (!defined('MAISHAPAY_PUBLIC_KEY')) {
    define('MAISHAPAY_PUBLIC_KEY', getenv('MAISHAPAY_PUBLIC_KEY') ?: '');
}
if (!defined('MAISHAPAY_SECRET_KEY')) {
    define('MAISHAPAY_SECRET_KEY', getenv('MAISHAPAY_SECRET_KEY') ?: '');
}
if (!defined('MAISHAPAY_API_URL')) {
    define('MAISHAPAY_API_URL', getenv('MAISHAPAY_API_URL') ?: 'https://marchand.maishapay.online/api/payment/rest/vers1.0/merchant');
}
if (!defined('MAISHAPAY_CHECK_URL')) {
    define('MAISHAPAY_CHECK_URL', getenv('MAISHAPAY_CHECK_URL') ?: 'https://marchand.maishapay.online/api/transaction/rest/v2/check');
}
if (!defined('APP_URL')) {
    define('APP_URL', rtrim(getenv('APP_URL') ?: '', '/'));
}

/**
 * Nettoie et formate un numéro de téléphone RDC.
 * Retourne le format 10 chiffres (ex: 0992611845) ou false si invalide.
 */
function ec_numero_rdc($numero) {
    $n = preg_replace('/[^0-9]/', '', (string)$numero);
    // Format international 243991234567 -> 0991234567
    if (strlen($n) === 12 && substr($n, 0, 3) === '243') {
        $n = '0' . substr($n, 3);
    }
    // Format 9 chiffres sans le 0 : 991234567 -> 0991234567
    if (strlen($n) === 9 && in_array(substr($n, 0, 2), ['97','98','99','81','82','83','84','85','89','80','90','91'])) {
        $n = '0' . $n;
    }
    // Doit faire exactement 10 chiffres et commencer par 0
    if (strlen($n) === 10 && $n[0] === '0') {
        return $n;
    }
    return false;
}

/**
 * Détecte automatiquement l'opérateur Mobile Money d'après le préfixe
 */
function ec_detect_operator($numero) {
    $tel = ec_numero_rdc($numero);
    if (!$tel) return null;
    $pre = substr($tel, 0, 3);

    // Airtel Money (097, 098, 099)
    if (in_array($pre, ['097', '098', '099'])) {
        return 'AIRTEL';
    }
    // Vodacom M-Pesa (081, 082, 083)
    if (in_array($pre, ['081', '082', '083'])) {
        return 'MPESA';
    }
    // Orange Money (084, 085, 089, 080)
    if (in_array($pre, ['084', '085', '089', '080'])) {
        return 'ORANGE';
    }
    // Africell Money (090, 091)
    if (in_array($pre, ['090', '091'])) {
        return 'AFRICELL';
    }
    return null;
}

/**
 * Liste des opérateurs valides acceptés
 */
function ec_operateurs_valides() {
    return ['AIRTEL', 'MPESA', 'ORANGE', 'AFRICELL'];
}

/**
 * Génère l'URL de callback pour MaishaPay
 */
function maishapay_callback_url($ref) {
    return APP_URL . '/maishapay_callback.php?ref=' . rawurlencode($ref);
}

/**
 * Assure que la structure de la table `deposits` supporte les paiements MaishaPay
 */
function maishapay_ensure_schema($pdo) {
    static $checked = false;
    if ($checked) return;
    $checked = true;

    try {
        // Ajouter level_name si manquant
        $cols = $pdo->query("SHOW COLUMNS FROM deposits")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('level_name', $cols)) {
            $pdo->exec("ALTER TABLE deposits ADD COLUMN `level_name` VARCHAR(100) DEFAULT NULL AFTER `amount`");
        }
        if (!in_array('operator', $cols)) {
            $pdo->exec("ALTER TABLE deposits ADD COLUMN `operator` VARCHAR(30) DEFAULT 'AIRTEL' AFTER `amount`");
        }
        if (!in_array('gateway_txn_id', $cols)) {
            $pdo->exec("ALTER TABLE deposits ADD COLUMN `gateway_txn_id` VARCHAR(100) DEFAULT NULL AFTER `transaction_ref`");
        }
        $indexes = $pdo->query("SHOW INDEX FROM deposits WHERE Key_name = 'uq_deposit_transaction_ref'")->fetchAll();
        if (!$indexes) {
            $pdo->exec("ALTER TABLE deposits ADD UNIQUE INDEX `uq_deposit_transaction_ref` (`transaction_ref`)");
        }
        // Permettre que proof_image soit NULL car l'API MaishaPay est automatique
        $pdo->exec("ALTER TABLE deposits MODIFY COLUMN `proof_image` VARCHAR(255) DEFAULT NULL");
        $pdo->exec("ALTER TABLE deposits MODIFY COLUMN `airtel_sender_phone` VARCHAR(30) DEFAULT NULL");
    } catch (Exception $e) {
        error_log("[MaishaPay Schema] Migration notice: " . $e->getMessage());
    }
}

/**
 * Initie un dépôt automatique avec push Mobile Money (Airtel, Vodacom, Orange)
 * 
 * @param PDO $pdo
 * @param int $user_id
 * @param float $amount Montant en Francs Congolais (FC)
 * @param string $phone Numéro de téléphone de l'utilisateur
 * @param string|null $operator Opérateur (AIRTEL, MPESA, ORANGE, AFRICELL)
 * @param string $level_name Description du pack ou recharge
 * @return array ['ok' => bool, 'etat' => string, 'reference' => string, 'message' => string]
 */
function maishapay_initiate_deposit($pdo, $user_id, $amount, $phone, $operator = null, $level_name = 'Recharge Automatique') {
    maishapay_ensure_schema($pdo);
    
    $user_id = intval($user_id);
    $amount = round(floatval($amount), 2);

    if (!in_array(MAISHAPAY_MODE, [0, 1], true)) {
        return ['ok' => false, 'etat' => 'erreur', 'message' => 'Mode MaishaPay invalide.'];
    }

    if ($amount < 5000) {
        return ['ok' => false, 'etat' => 'erreur', 'message' => 'Le montant minimum de dépôt est de 5 000 FC.'];
    }

    $tel = ec_numero_rdc($phone);
    if (!$tel) {
        return ['ok' => false, 'etat' => 'erreur', 'message' => 'Numéro Mobile Money invalide. Veuillez saisir un numéro valide (ex: 0992611845).'];
    }

    // Détection ou confirmation de l'opérateur
    $detected_operator = ec_detect_operator($tel);
    $op = strtoupper(trim((string)$operator));
    if (!$detected_operator || ($op !== '' && !in_array($op, ec_operateurs_valides(), true))) {
        return ['ok' => false, 'etat' => 'erreur', 'message' => 'Opérateur Mobile Money non pris en charge pour ce numéro.'];
    }
    if ($op !== '' && $op !== $detected_operator) {
        return ['ok' => false, 'etat' => 'erreur', 'message' => 'L’opérateur sélectionné ne correspond pas au numéro saisi.'];
    }
    $op = $detected_operator;

    // Éviter les doubles dépôts simultanés en attente de moins de 2 minutes
    $stmt_check = $pdo->prepare("SELECT transaction_ref FROM deposits WHERE user_id = ? AND status = 'en_attente' AND created_at > (NOW() - INTERVAL 2 MINUTE) LIMIT 1");
    $stmt_check->execute([$user_id]);
    $deja = $stmt_check->fetch();
    if ($deja && !empty($deja['transaction_ref'])) {
        return [
            'ok' => true,
            'etat' => 'attente',
            'reference' => $deja['transaction_ref'],
            'message' => 'Une transaction est déjà en cours. Veuillez valider le message push sur votre téléphone en saisissant votre code PIN Mobile Money.'
        ];
    }

    // Informations du compte utilisateur
    $stmt_u = $pdo->prepare("SELECT full_name, email FROM users WHERE id = ?");
    $stmt_u->execute([$user_id]);
    $user = $stmt_u->fetch() ?: [];

    $nom = trim($user['full_name'] ?? '') ?: 'Investisseur RentTech';
    $email = trim($user['email'] ?? '') ?: 'investisseur@renttech.com';

    // Génération de la référence unique
    $ref = 'DEP-' . date('ymdHis') . '-' . strtoupper(bin2hex(random_bytes(8)));
    $callback_url = maishapay_callback_url($ref);

    if (MAISHAPAY_MODE !== 0) {
        if (!MAISHAPAY_PUBLIC_KEY || !MAISHAPAY_SECRET_KEY || !function_exists('curl_init')) {
            return ['ok' => false, 'etat' => 'erreur', 'message' => 'La passerelle MaishaPay n’est pas correctement configurée sur le serveur.'];
        }
        if (!filter_var($callback_url, FILTER_VALIDATE_URL) || strpos($callback_url, 'https://') !== 0) {
            return ['ok' => false, 'etat' => 'erreur', 'message' => 'L’URL publique HTTPS du callback MaishaPay doit être configurée.'];
        }
    }

    // Le mode sandbox ne crée pas de dépôt et ne modifie aucun solde réel.
    if (MAISHAPAY_MODE === 0) {
        return [
            'ok'        => true,
            'etat'      => 'reussi',
            'reference' => $ref,
            'message'   => "Simulation Sandbox terminée pour " . number_format($amount, 0, ',', ' ') . " FC. Aucun paiement réel ni crédit de portefeuille n’a été effectué."
        ];
    }

    // Enregistrement préalable du dépôt en base
    $stmt_ins = $pdo->prepare("INSERT INTO deposits (user_id, amount, level_name, operator, airtel_sender_phone, transaction_ref, proof_image, status) VALUES (?, ?, ?, ?, ?, ?, 'MAISHAPAY_AUTO', 'en_attente')");
    $stmt_ins->execute([$user_id, $amount, $level_name, $op, $tel, $ref]);
    $deposit_id = $pdo->lastInsertId();

    // Construction du payload pour l'API MaishaPay Mobile Money
    $payload = [
        "gatewayMode"          => (int) MAISHAPAY_MODE,
        "publicApiKey"         => MAISHAPAY_PUBLIC_KEY,
        "secretApiKey"         => MAISHAPAY_SECRET_KEY,
        "transactionReference" => $ref,
        "amount"               => (float) $amount,
        "currency"             => "CDF",
        "customerFullName"     => $nom,
        "customerPhoneNumber"  => $tel,
        "customerEmailAddress" => $email,
        "chanel"               => "MOBILEMONEY",
        "provider"             => $op,
        "walletID"             => $tel,
        "callbackUrl"          => $callback_url,
    ];

    // Appel cURL sécurisé vers MaishaPay
    $ch = curl_init(MAISHAPAY_API_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 45,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $reponse = curl_exec($ch);
    $err_curl = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode((string)$reponse, true);
    $apiData = is_array($decoded) && isset($decoded['data']) && is_array($decoded['data'])
        ? $decoded['data']
        : (is_array($decoded) ? $decoded : []);

    // Analyse de la réponse MaishaPay
    $statusCode = (int) ($apiData['statusCode'] ?? 0);
    $statusDesc = strtoupper((string) ($apiData['statusDescription'] ?? ($decoded['message'] ?? '')));
    $gatewayTxn = (string) ($apiData['transactionId'] ?? ($decoded['transactionId'] ?? ''));

    if ($gatewayTxn) {
        $stmt_up = $pdo->prepare("UPDATE deposits SET gateway_txn_id = ? WHERE id = ?");
        $stmt_up->execute([$gatewayTxn, $deposit_id]);
    }

    $is_accepted = $reponse !== false
        && !$err_curl
        && $http_code >= 200
        && $http_code < 300
        && (
            in_array($statusCode, [200, 201, 202], true)
            || in_array($statusDesc, ['ACCEPTED', 'PENDING', 'SUCCESS'], true)
            || (isset($decoded['status']) && $decoded['status'] === 'success')
        );

    // Cas 2 : Mode Production (MAISHAPAY_MODE = 1)
    if ($is_accepted) {
        return [
            'ok'        => true,
            'etat'      => 'attente',
            'reference' => $ref,
            'operator'  => $op,
            'phone'     => $tel,
            'amount'    => $amount,
            'message'   => "Un push Mobile Money a été envoyé sur votre téléphone ({$tel}). Veuillez saisir votre mot de passe / code PIN Mobile Money pour valider le débit de " . number_format($amount, 0, ',', ' ') . " FC."
        ];
    }

    // En cas d'erreur de la passerelle
    $err_msg = (is_array($decoded) ? ($decoded['message'] ?? null) : null)
        ?: ($err_curl ?: "Impossible d'initier la demande Mobile Money. Veuillez vérifier votre numéro et réessayer.");
    
    // Si échec clair, on note l'échec
    $stmt_fail = $pdo->prepare("UPDATE deposits SET status = 'rejete', admin_note = ? WHERE id = ?");
    $stmt_fail->execute(["Échec passerelle: " . substr($err_msg, 0, 200), $deposit_id]);

    return [
        'ok'        => false,
        'etat'      => 'erreur',
        'reference' => $ref,
        'message'   => $err_msg
    ];
}

/**
 * Confirme et valide un dépôt de façon atomique ACID (idempotence garantie)
 * Crédite le solde de l'utilisateur et verse la commission parrain de 20%.
 */
function maishapay_confirm_deposit($pdo, $ref, $gateway_txn_id = null) {
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM deposits WHERE transaction_ref = ? AND status = 'en_attente' FOR UPDATE");
        $stmt->execute([$ref]);
        $deposit = $stmt->fetch();

        if (!$deposit) {
            $pdo->rollBack();
            // Si le dépôt est déjà approuvé, on retourne true (idempotence)
            $stmt_already = $pdo->prepare("SELECT status FROM deposits WHERE transaction_ref = ?");
            $stmt_already->execute([$ref]);
            $d = $stmt_already->fetch();
            return ($d && $d['status'] === 'approuve');
        }

        $deposit_id = $deposit['id'];
        $user_id = $deposit['user_id'];
        $amount = floatval($deposit['amount']);

        // 1. Mise à jour du statut du dépôt
        $stmt_up_dep = $pdo->prepare("UPDATE deposits SET status = 'approuve', gateway_txn_id = COALESCE(?, gateway_txn_id), processed_at = NOW() WHERE id = ?");
        $stmt_up_dep->execute([$gateway_txn_id, $deposit_id]);

        // 2. Crédit du solde et cumul investi de l'utilisateur
        $stmt_up_usr = $pdo->prepare("UPDATE users SET balance = balance + ?, total_invested = total_invested + ? WHERE id = ?");
        $stmt_up_usr->execute([$amount, $amount, $user_id]);

        // 3. Journal financier de l'utilisateur
        $stmt_log = $pdo->prepare("INSERT INTO financial_logs (user_id, type, amount, description) VALUES (?, 'deposit', ?, ?)");
        $stmt_log->execute([$user_id, $amount, "Dépôt automatique MaishaPay Mobile Money (" . number_format($amount, 0, ',', ' ') . " FC)"]);

        // 4. Attribution de la commission de parrainage de 20%
        $stmt_usr = $pdo->prepare("SELECT referred_by, full_name FROM users WHERE id = ?");
        $stmt_usr->execute([$user_id]);
        $investor = $stmt_usr->fetch();

        if (!empty($investor['referred_by'])) {
            $stmt_sponsor = $pdo->prepare("SELECT id, full_name FROM users WHERE referral_code = ?");
            $stmt_sponsor->execute([$investor['referred_by']]);
            $sponsor = $stmt_sponsor->fetch();

            if ($sponsor) {
                $commission = $amount * (defined('REFERRAL_COMMISSION_PERCENT') ? REFERRAL_COMMISSION_PERCENT / 100 : 0.20);

                // Crédit du sponsor
                $stmt_up_spon = $pdo->prepare("UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?");
                $stmt_up_spon->execute([$commission, $commission, $sponsor['id']]);

                // Journal financier pour le parrain
                $stmt_log_spon = $pdo->prepare("INSERT INTO financial_logs (user_id, type, amount, description) VALUES (?, 'referral_bonus', ?, ?)");
                $stmt_log_spon->execute([
                    $sponsor['id'],
                    $commission,
                    "Commission de parrainage (20%) sur le dépôt automatique de " . $investor['full_name']
                ]);

                // Enregistrement dans referral_commissions si la table existe
                try {
                    $stmt_ref_comm = $pdo->prepare("INSERT INTO referral_commissions (sponsor_id, referred_id, deposit_id, deposit_amount, commission_amount) VALUES (?, ?, ?, ?, ?)");
                    $stmt_ref_comm->execute([$sponsor['id'], $user_id, $deposit_id, $amount, $commission]);
                } catch (Exception $e) {
                    // Ignorer si contrainte différente
                }
            }
        }

        $pdo->commit();
        return true;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("[MaishaPay Confirm Error] " . $e->getMessage());
        return false;
    }
}

/**
 * Vérifie l'état d'une transaction auprès de MaishaPay (API Check v2)
 * 
 * @param PDO $pdo
 * @param string $ref Référence transaction
 * @return array ['status' => 'en_attente'|'approuve'|'rejete', 'message' => string]
 */
function maishapay_check_status($pdo, $ref) {
    maishapay_ensure_schema($pdo);

    if (MAISHAPAY_MODE !== 1) {
        return ['status' => 'erreur', 'message' => 'La vérification fournisseur est disponible uniquement en mode production.'];
    }

    $stmt = $pdo->prepare("SELECT * FROM deposits WHERE transaction_ref = ? LIMIT 1");
    $stmt->execute([$ref]);
    $deposit = $stmt->fetch();

    if (!$deposit) {
        return ['status' => 'introuvable', 'message' => 'Transaction introuvable.'];
    }

    if ($deposit['status'] === 'approuve') {
        return ['status' => 'approuve', 'message' => 'Paiement déjà validé et crédité.'];
    }

    if ($deposit['status'] === 'rejete') {
        return ['status' => 'rejete', 'message' => 'Paiement rejeté ou annulé.'];
    }

    if (!MAISHAPAY_PUBLIC_KEY || !MAISHAPAY_SECRET_KEY || !function_exists('curl_init')) {
        return ['status' => 'erreur', 'message' => 'La passerelle MaishaPay n’est pas correctement configurée sur le serveur.'];
    }

    // Interrogation de l'API Check MaishaPay
    $url = MAISHAPAY_CHECK_URL . '?useRef=1';
    $payload = [
        'gatewayMode'   => (int) MAISHAPAY_MODE,
        'publicApiKey'  => MAISHAPAY_PUBLIC_KEY,
        'secretApiKey'  => MAISHAPAY_SECRET_KEY,
        'transactionId' => (string) $ref,
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $response = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $curl_error || $http_code < 200 || $http_code >= 300) {
        error_log("[MaishaPay Check] Échec HTTP {$http_code}: {$curl_error}");
        return ['status' => 'en_attente', 'message' => 'Vérification MaishaPay momentanément indisponible.'];
    }

    $decoded = json_decode((string)$response, true);
    if (!is_array($decoded)) {
        return ['status' => 'en_attente', 'message' => 'Réponse de vérification MaishaPay invalide.'];
    }
    
    // Analyse du statut retourné par MaishaPay
    $statut_brut = strtolower((string) ($decoded['status'] ?? ($decoded['data']['status'] ?? '')));
    $desc = strtolower((string) ($decoded['statusDescription'] ?? ($decoded['data']['statusDescription'] ?? '')));
    $txn_id = $decoded['transactionId'] ?? ($decoded['data']['transactionId'] ?? null);

    if (in_array($statut_brut, ['success', 'completed', 'paid'], true) || in_array($desc, ['success', 'completed', 'approved'], true)) {
        if (maishapay_confirm_deposit($pdo, $ref, $txn_id)) {
            return ['status' => 'approuve', 'message' => 'Paiement confirmé par MaishaPay !'];
        }
        return ['status' => 'erreur', 'message' => 'Le paiement est confirmé, mais le crédit du dépôt a échoué. Une vérification administrateur est nécessaire.'];
    }

    if (in_array($statut_brut, ['failed', 'rejected', 'canceled'], true) || in_array($desc, ['failed', 'rejected', 'cancelled'], true)) {
        $stmt_fail = $pdo->prepare("UPDATE deposits SET status = 'rejete', processed_at = NOW(), admin_note = 'Refus opérateur MaishaPay' WHERE transaction_ref = ? AND status = 'en_attente'");
        $stmt_fail->execute([$ref]);
        return ['status' => 'rejete', 'message' => 'Le paiement a été refusé par l\'opérateur.'];
    }

    return ['status' => 'en_attente', 'message' => 'En attente de validation PIN par le client.'];
}
