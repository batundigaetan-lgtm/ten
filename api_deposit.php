<?php
/**
 * Endpoint API AJAX pour les dépôts automatiques MaishaPay
 * Permet l'initiation en direct du push Mobile Money et la vérification en temps réel du statut
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/maishapay.php';

header('Content-Type: application/json; charset=utf-8');

// Vérification de la session utilisateur
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Session expirée. Veuillez vous reconnecter.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'initiate') {
    // Vérification CSRF
    $token = $_POST['csrf_token'] ?? '';
    if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'message' => 'Jeton de sécurité CSRF invalide ou expiré.']);
        exit;
    }

    $amount = floatval($_POST['amount'] ?? 0);
    $phone = sanitize($_POST['phone'] ?? '');
    $operator = sanitize($_POST['operator'] ?? '');
    $level_name = sanitize($_POST['level_name'] ?? 'Recharge Automatique');

    if ($amount < 5000) {
        echo json_encode(['ok' => false, 'message' => 'Le montant minimum de dépôt est de 5 000 FC.']);
        exit;
    }

    if (empty($phone)) {
        echo json_encode(['ok' => false, 'message' => 'Veuillez saisir votre numéro Mobile Money.']);
        exit;
    }

    $result = maishapay_initiate_deposit($pdo, $user_id, $amount, $phone, $operator, $level_name);

    // En cas de succès immédiat (ex: mode sandbox), récupérer le nouveau solde
    if ($result['ok'] && $result['etat'] === 'reussi') {
        $stmt_u = $pdo->prepare("SELECT balance FROM users WHERE id = ?");
        $stmt_u->execute([$user_id]);
        $result['new_balance'] = floatval($stmt_u->fetchColumn() ?: 0);
    }

    echo json_encode($result);
    exit;
}

if ($action === 'check') {
    $ref = sanitize($_GET['reference'] ?? $_POST['reference'] ?? '');

    if (empty($ref)) {
        echo json_encode(['ok' => false, 'message' => 'Référence manquante.']);
        exit;
    }

    $stmt_owner = $pdo->prepare("SELECT id FROM deposits WHERE transaction_ref = ? AND user_id = ? LIMIT 1");
    $stmt_owner->execute([$ref, $user_id]);
    if (!$stmt_owner->fetch()) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'message' => 'Transaction introuvable.']);
        exit;
    }

    $res = maishapay_check_status($pdo, $ref);

    $stmt_u = $pdo->prepare("SELECT balance FROM users WHERE id = ?");
    $stmt_u->execute([$user_id]);
    $res['new_balance'] = floatval($stmt_u->fetchColumn() ?: 0);
    $res['ok'] = true;

    echo json_encode($res);
    exit;
}

echo json_encode(['ok' => false, 'message' => 'Action non reconnue.']);
