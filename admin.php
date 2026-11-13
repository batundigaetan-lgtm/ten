<?php
/**
 * RentTech Hub - Panneau Administrateur Ultra-Sécurisé
 * Verification par Code PIN à 6 Chiffres (998844), Validation des dépôts, 
 * distribution automatique de la commission parrainage 20%, et journal comptable.
 */

require_once 'config.php';
check_admin();

$message = '';
$error = '';
$csrf_token = generate_csrf_token();

// VERROUILLAGE MANUEL DE LA SESSION ADMIN
if (isset($_GET['lock_admin']) && $_GET['lock_admin'] == 1) {
    unset($_SESSION['admin_pin_verified']);
    header("Location: admin.php");
    exit;
}

// TRAITEMENT DE LA VÉRIFICATION DU CODE PIN ADMIN (CODE DE SÉCURITÉ : 998844)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'verify_pin') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    
    $rate_check = check_rate_limit('admin_pin_attempt');
    if ($rate_check !== true) {
        $error = $rate_check;
    } else {
        $entered_pin = sanitize($_POST['pin_code'] ?? '');
        if ($entered_pin === ADMIN_SECURITY_PIN) {
            $_SESSION['admin_pin_verified'] = true;
            reset_rate_limit('admin_pin_attempt');
            $message = "Code de sécurité PIN (998844) validé avec succès ! Espace Administrateur déverrouillé.";
        } else {
            $error = "Code PIN de sécurité incorrect. Accès refusé.";
        }
    }
}

// SI LE CODE PIN N'EST PAS ENCORE VALIDÉ DANS LA SESSION -> AFFICHER ÉCRAN DE VERROUILLAGE SÉCURISÉ PIN
if (!isset($_SESSION['admin_pin_verified']) || $_SESSION['admin_pin_verified'] !== true):
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentTech Hub - Authentification PIN Administrateur</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: radial-gradient(circle at center, #111827 0%, #0b111e 100%);
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
        }
        .pin-card {
            background: rgba(17, 24, 39, 0.95);
            border: 1px solid rgba(245, 158, 11, 0.4);
            border-radius: 28px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15);
            max-width: 440px;
            width: 100%;
        }
        .text-gold { color: #f59e0b; }
        .btn-gold {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 800;
            border: none;
            border-radius: 14px;
        }
        .btn-gold:hover {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
        }
        .pin-input {
            letter-spacing: 0.8rem;
            font-size: 1.8rem;
            text-align: center;
            background: #1f2937;
            border: 2px solid #374151;
            color: #f59e0b;
            border-radius: 16px;
        }
        .pin-input:focus {
            background: #111827;
            border-color: #f59e0b;
            color: #f59e0b;
            box-shadow: 0 0 0 0.25rem rgba(245, 158, 11, 0.25);
        }
    </style>
</head>
<body>
<div class="container p-3">
    <div class="pin-card p-4 p-sm-5 mx-auto text-center">
        <div class="mb-3">
            <div class="d-inline-flex p-3 bg-dark border border-warning rounded-circle shadow-lg mb-2">
                <i class="bi bi-shield-lock-fill text-gold fs-1"></i>
            </div>
            <h3 class="fw-bold text-gold">Accès Réservé Direction</h3>
            <p class="text-muted small">Veuillez entrer le Code de Sécurité PIN à 6 chiffres pour accéder au panneau de trésorerie.</p>
            <span class="badge bg-warning text-dark font-mono px-3 py-1">Code PIN Par Défaut : 998844</span>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-danger rounded-4 text-center py-2 mb-3" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-1"></i><?= $error ?>
            </div>
        <?php endif; ?>

        <form action="admin.php" method="POST">
            <input type="hidden" name="action" value="verify_pin">
            <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
            
            <div class="mb-4">
                <input type="password" name="pin_code" maxlength="6" autofocus required class="form-control pin-input py-3" placeholder="••••••">
            </div>

            <button type="submit" class="btn btn-gold w-100 py-3 fs-6 mb-3">
                <i class="bi bi-unlock-fill me-2"></i> Déverrouiller le Panneau Admin
            </button>
            
            <a href="dashboard.php" class="text-muted text-decoration-none small">
                <i class="bi bi-arrow-left me-1"></i> Retourner à l'Espace Investisseur
            </a>
        </form>
    </div>
</div>
</body>
</html>
<?php
exit;
endif;

// SI LE CODE PIN EST VALIDÉ, ACCÉDER AUX ACTIONS ADMINISTRATEUR

// APPROBATION D'UN DÉPÔT (Transaction ACID + Commission Parrain 20%)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'approve_deposit') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    $deposit_id = intval($_POST['deposit_id']);

    try {
        $pdo->beginTransaction();

        $stmt_dep = $pdo->prepare("SELECT * FROM deposits WHERE id = ? AND status = 'en_attente' FOR UPDATE");
        $stmt_dep->execute([$deposit_id]);
        $deposit = $stmt_dep->fetch();

        if (!$deposit) {
            throw new Exception("Dépôt introuvable ou déjà traité.");
        }
        if (in_array($deposit['proof_image'], ['MAISHAPAY_AUTO', 'MAISHAPAY_PUSH'], true)) {
            throw new Exception("Un dépôt MaishaPay doit être confirmé par l’API avant tout crédit.");
        }

        $user_id = $deposit['user_id'];
        $amount = $deposit['amount'];

        $stmt_up_dep = $pdo->prepare("UPDATE deposits SET status = 'approuve', processed_at = NOW() WHERE id = ?");
        $stmt_up_dep->execute([$deposit_id]);

        $stmt_up_usr = $pdo->prepare("UPDATE users SET balance = balance + ?, total_invested = total_invested + ? WHERE id = ?");
        $stmt_up_usr->execute([$amount, $amount, $user_id]);

        $stmt_log1 = $pdo->prepare("INSERT INTO financial_logs (user_id, type, amount, description) VALUES (?, 'deposit', ?, ?)");
        $stmt_log1->execute([$user_id, $amount, "Dépôt approuvé de " . number_format($amount, 0, ',', ' ') . " FC"]);

        $stmt_usr = $pdo->prepare("SELECT referred_by, full_name FROM users WHERE id = ?");
        $stmt_usr->execute([$user_id]);
        $investor = $stmt_usr->fetch();

        if (!empty($investor['referred_by'])) {
            $stmt_sponsor = $pdo->prepare("SELECT id, full_name FROM users WHERE referral_code = ?");
            $stmt_sponsor->execute([$investor['referred_by']]);
            $sponsor = $stmt_sponsor->fetch();

            if ($sponsor) {
                $commission = $amount * (REFERRAL_COMMISSION_PERCENT / 100);

                $stmt_up_spon = $pdo->prepare("UPDATE users SET balance = balance + ?, total_earned = total_earned + ? WHERE id = ?");
                $stmt_up_spon->execute([$commission, $commission, $sponsor['id']]);

                $stmt_log2 = $pdo->prepare("INSERT INTO financial_logs (user_id, type, amount, description) VALUES (?, 'referral_bonus', ?, ?)");
                $stmt_log2->execute([
                    $sponsor['id'],
                    $commission,
                    "Commission de parrainage (20%) sur le dépôt de " . $investor['full_name']
                ]);
            }
        }

        $pdo->commit();
        $message = "Le dépôt de " . number_format($amount, 0, ',', ' ') . " FC a été approuvé avec succès !";
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = $e->getMessage();
    }
}

// REJET D'UN DÉPÔT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'reject_deposit') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    $deposit_id = intval($_POST['deposit_id']);

    $stmt_rej = $pdo->prepare("UPDATE deposits SET status = 'rejete', processed_at = NOW() WHERE id = ? AND status = 'en_attente' AND proof_image NOT IN ('MAISHAPAY_AUTO', 'MAISHAPAY_PUSH')");
    if ($stmt_rej->execute([$deposit_id]) && $stmt_rej->rowCount() > 0) {
        $message = "La demande de dépôt a été rejetée.";
    } else {
        $error = "Erreur lors du rejet du dépôt.";
    }
}

// VÉRIFICATION EN DIRECT MAISHAPAY API
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'check_maishapay') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    require_once __DIR__ . '/maishapay.php';
    $ref = sanitize($_POST['ref'] ?? '');
    $res = maishapay_check_status($pdo, $ref);
    if ($res['status'] === 'approuve') {
        $message = "MaishaPay a confirmé le paiement ! Le portefeuille a été crédité et les commissions versées.";
    } else {
        $error = "Statut MaishaPay pour {$ref} : " . $res['message'];
    }
}

// APPROBATION D'UN RETRAIT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'approve_withdrawal') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    $withdrawal_id = intval($_POST['withdrawal_id']);

    try {
        $pdo->beginTransaction();

        $stmt_w = $pdo->prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'en_attente' FOR UPDATE");
        $stmt_w->execute([$withdrawal_id]);
        $withdrawal = $stmt_w->fetch();

        if (!$withdrawal) {
            throw new Exception("Demande de retrait introuvable ou déjà traitée.");
        }

        $user_id = $withdrawal['user_id'];
        $amount = $withdrawal['amount'];

        $stmt_u = $pdo->prepare("SELECT balance FROM users WHERE id = ?");
        $stmt_u->execute([$user_id]);
        $user = $stmt_u->fetch();

        if ($user['balance'] < $amount) {
            throw new Exception("Le solde de l'utilisateur est inférieur au montant demandé.");
        }

        $stmt_sub = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
        $stmt_sub->execute([$amount, $user_id]);

        $stmt_up_w = $pdo->prepare("UPDATE withdrawals SET status = 'approuve', processed_at = NOW() WHERE id = ?");
        $stmt_up_w->execute([$withdrawal_id]);

        $stmt_log = $pdo->prepare("INSERT INTO financial_logs (user_id, type, amount, description) VALUES (?, 'withdrawal', ?, ?)");
        $stmt_log->execute([$user_id, $amount, "Retrait effectué de " . number_format($amount, 0, ',', ' ') . " FC via Airtel Money"]);

        $pdo->commit();
        $message = "Retrait de " . number_format($amount, 0, ',', ' ') . " FC confirmé avec succès !";
    } catch (Exception $e) {
        $pdo->rollBack();
        $error = $e->getMessage();
    }
}

// REJET D'UN RETRAIT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'reject_withdrawal') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    $withdrawal_id = intval($_POST['withdrawal_id']);

    $stmt_rej_w = $pdo->prepare("UPDATE withdrawals SET status = 'rejete', processed_at = NOW() WHERE id = ? AND status = 'en_attente'");
    if ($stmt_rej_w->execute([$withdrawal_id])) {
        $message = "La demande de retrait a été rejetée.";
    } else {
        $error = "Erreur lors du rejet du retrait.";
    }
}

// Récupération des dépôts en attente
$stmt_pending_deps = $pdo->query("
    SELECT d.*, u.full_name, u.email, u.phone 
    FROM deposits d 
    JOIN users u ON d.user_id = u.id 
    WHERE d.status = 'en_attente' 
    ORDER BY d.id DESC
");
$pending_deposits = $stmt_pending_deps->fetchAll();

// Récupération des retraits en attente
$stmt_pending_withs = $pdo->query("
    SELECT w.*, u.full_name, u.email, u.balance 
    FROM withdrawals w 
    JOIN users u ON w.user_id = u.id 
    WHERE w.status = 'en_attente' 
    ORDER BY w.id DESC
");
$pending_withdrawals = $stmt_pending_withs->fetchAll();

// Statistiques globales
$total_users = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();
$total_deposits = $pdo->query("SELECT SUM(amount) FROM deposits WHERE status = 'approuve'")->fetchColumn() ?: 0;
$total_withdrawals = $pdo->query("SELECT SUM(amount) FROM withdrawals WHERE status = 'approuve'")->fetchColumn() ?: 0;
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentTech Hub - Administration Trésorerie Sécurisée</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background-color: #0b111e;
            color: #f3f4f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar-custom {
            background-color: #111827;
            border-bottom: 1px solid #1f2937;
        }
        .card-custom {
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .text-gold { color: #f59e0b; }
        .btn-gold {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 700;
            border: none;
        }
        .btn-gold:hover {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
        }
        .proof-thumbnail {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid #374151;
        }
    </style>
</head>
<body class="pb-5">

<!-- Header / Navbar Desktop -->
<nav class="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
    <div class="container">
        <a class="navbar-brand fw-bold text-gold fs-4" href="admin.php">
            <i class="bi bi-shield-lock-fill me-2"></i>RentTech Hub - Espace Admin
        </a>
        <div class="d-flex align-items-center gap-2">
            <span class="badge bg-success border border-emerald-500 text-black font-mono">PIN Validé (998844)</span>
            <a href="admin.php?lock_admin=1" class="btn btn-outline-warning btn-sm"><i class="bi bi-lock-fill me-1"></i> Verrouiller PIN</a>
            <a href="dashboard.php" class="btn btn-outline-light btn-sm"><i class="bi bi-speedometer2 me-1"></i> Vue Investor</a>
            <a href="logout.php" class="btn btn-outline-danger btn-sm"><i class="bi bi-box-arrow-right me-1"></i> Déconnexion</a>
        </div>
    </div>
</nav>

<div class="container my-4">

    <!-- Messages d'Alerte -->
    <?php if ($message): ?>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i><?= $message ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i><?= $error ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <!-- STATISTIQUES GLOBALES -->
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card card-custom p-3 text-center">
                <span class="text-muted small"><i class="bi bi-people me-1"></i> Investisseurs Inscrits</span>
                <h3 class="text-white fw-bold my-1"><?= $total_users ?></h3>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card card-custom p-3 text-center">
                <span class="text-muted small"><i class="bi bi-arrow-down-left-circle text-success me-1"></i> Total Dépôts Approuvés</span>
                <h3 class="text-success fw-bold my-1"><?= number_format($total_deposits, 0, ',', ' ') ?> FC</h3>
            </div>
        </div>
        <div class="col-md-4">
            <div class="card card-custom p-3 text-center">
                <span class="text-muted small"><i class="bi bi-arrow-up-right-circle text-danger me-1"></i> Total Retraits Effectués</span>
                <h3 class="text-danger fw-bold my-1"><?= number_format($total_withdrawals, 0, ',', ' ') ?> FC</h3>
            </div>
        </div>
    </div>

    <!-- LISTE DES DÉPÔTS EN ATTENTE -->
    <div class="card card-custom p-4 mb-4">
        <h5 class="text-gold fw-bold mb-3"><i class="bi bi-clock-history me-2"></i> Demandes de Dépôt / Recharge Mobile Money (MaishaPay)</h5>
        <div class="table-responsive">
            <table class="table table-dark table-striped align-middle">
                <thead>
                    <tr>
                        <th>Investisseur</th>
                        <th>Pack / Description</th>
                        <th>Montant</th>
                        <th>Opérateur & Réf</th>
                        <th>Preuve / Type</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($pending_deposits)): ?>
                        <tr><td colspan="7" class="text-center text-muted py-4">Aucune demande de dépôt en attente.</td></tr>
                    <?php else: ?>
                        <?php foreach ($pending_deposits as $dep): ?>
                            <tr>
                                <td>
                                    <div class="fw-bold"><?= htmlspecialchars($dep['full_name']) ?></div>
                                    <small class="text-muted"><?= htmlspecialchars($dep['phone']) ?></small>
                                </td>
                                <td><?= htmlspecialchars($dep['level_name'] ?? 'Recharge') ?></td>
                                <td class="fw-bold text-gold fs-5"><?= number_format($dep['amount'], 0, ',', ' ') ?> FC</td>
                                <td>
                                    <?php 
                                    $op = strtoupper($dep['operator'] ?? 'AIRTEL');
                                    if ($op === 'AIRTEL'): ?>
                                        <span class="badge bg-danger">Airtel</span>
                                    <?php elseif ($op === 'MPESA'): ?>
                                        <span class="badge bg-primary">M-Pesa</span>
                                    <?php elseif ($op === 'ORANGE'): ?>
                                        <span class="badge bg-warning text-dark">Orange</span>
                                    <?php else: ?>
                                        <span class="badge bg-secondary"><?= htmlspecialchars($op) ?></span>
                                    <?php endif; ?>
                                    <div class="mt-1"><code class="text-info small"><?= htmlspecialchars($dep['transaction_ref'] ?? '') ?></code></div>
                                </td>
                                <td>
                                    <?php if (!empty($dep['proof_image']) && !in_array($dep['proof_image'], ['MAISHAPAY_AUTO', 'MAISHAPAY_PUSH'])): ?>
                                        <a href="uploads/<?= htmlspecialchars($dep['proof_image']) ?>" target="_blank">
                                            <img src="uploads/<?= htmlspecialchars($dep['proof_image']) ?>" class="proof-thumbnail" alt="Preuve">
                                        </a>
                                    <?php else: ?>
                                        <span class="badge bg-info text-dark"><i class="bi bi-phone-vibrate me-1"></i> Push MaishaPay</span>
                                    <?php endif; ?>
                                </td>
                                <td><?= date('d/m/Y H:i', strtotime($dep['created_at'])) ?></td>
                                <td>
                                    <div class="d-flex flex-wrap gap-2">
                                        <?php if (!empty($dep['transaction_ref'])): ?>
                                            <form action="admin.php" method="POST">
                                                <input type="hidden" name="action" value="check_maishapay">
                                                <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                                                <input type="hidden" name="ref" value="<?= htmlspecialchars($dep['transaction_ref']) ?>">
                                                <button type="submit" class="btn btn-outline-info btn-sm fw-bold"><i class="bi bi-arrow-repeat me-1"></i> Vérifier API</button>
                                            </form>
                                        <?php endif; ?>

                                        <?php if (!in_array($dep['proof_image'], ['MAISHAPAY_AUTO', 'MAISHAPAY_PUSH'], true)): ?>
                                            <?php if (!in_array($dep['proof_image'], ['MAISHAPAY_AUTO', 'MAISHAPAY_PUSH'], true)): ?>
                                                <form action="admin.php" method="POST" onsubmit="return confirm('Voulez-vous vraiment approuver ce dépôt et verser les commissions ?');">
                                                    <input type="hidden" name="action" value="approve_deposit">
                                                    <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                                                    <input type="hidden" name="deposit_id" value="<?= $dep['id'] ?>">
                                                    <button type="submit" class="btn btn-success btn-sm fw-bold"><i class="bi bi-check-lg me-1"></i> Approuver</button>
                                                </form>
                                            <?php endif; ?>
                                        <?php endif; ?>

                                        <?php if (!in_array($dep['proof_image'], ['MAISHAPAY_AUTO', 'MAISHAPAY_PUSH'], true)): ?>
                                            <form action="admin.php" method="POST" onsubmit="return confirm('Rejeter ce dépôt ?');">
                                                <input type="hidden" name="action" value="reject_deposit">
                                                <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                                                <input type="hidden" name="deposit_id" value="<?= $dep['id'] ?>">
                                                <button type="submit" class="btn btn-danger btn-sm"><i class="bi bi-x-lg me-1"></i> Rejeter</button>
                                            </form>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- LISTE DES RETRAITS EN ATTENTE -->
    <div class="card card-custom p-4">
        <h5 class="text-gold fw-bold mb-3"><i class="bi bi-cash-stack me-2"></i> Demandes de Retrait En Attente</h5>
        <div class="table-responsive">
            <table class="table table-dark table-striped align-middle">
                <thead>
                    <tr>
                        <th>Investisseur</th>
                        <th>Montant Demandé</th>
                        <th>Numéro Airtel Money</th>
                        <th>Solde Actuel</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($pending_withdrawals)): ?>
                        <tr><td colspan="6" class="text-center text-muted py-4">Aucune demande de retrait en attente.</td></tr>
                    <?php else: ?>
                        <?php foreach ($pending_withdrawals as $w): ?>
                            <tr>
                                <td>
                                    <div class="fw-bold"><?= htmlspecialchars($w['full_name']) ?></div>
                                    <small class="text-muted"><?= htmlspecialchars($w['email']) ?></small>
                                </td>
                                <td class="fw-bold text-danger fs-5"><?= number_format($w['amount'], 0, ',', ' ') ?> FC</td>
                                <td class="fw-bold text-gold"><i class="bi bi-phone me-1"></i><?= htmlspecialchars($w['phone_number']) ?></td>
                                <td><?= number_format($w['balance'], 0, ',', ' ') ?> FC</td>
                                <td><?= date('d/m/Y H:i', strtotime($w['created_at'])) ?></td>
                                <td>
                                    <div class="d-flex gap-2">
                                        <form action="admin.php" method="POST" onsubmit="return confirm('Avez-vous bien envoyé l\'argent via Airtel Money ?');">
                                            <input type="hidden" name="action" value="approve_withdrawal">
                                            <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                                            <input type="hidden" name="withdrawal_id" value="<?= $w['id'] ?>">
                                            <button type="submit" class="btn btn-gold btn-sm"><i class="bi bi-check-all me-1"></i> Confirmer Paiement</button>
                                        </form>

                                        <form action="admin.php" method="POST" onsubmit="return confirm('Rejeter cette demande de retrait ?');">
                                            <input type="hidden" name="action" value="reject_withdrawal">
                                            <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                                            <input type="hidden" name="withdrawal_id" value="<?= $w['id'] ?>">
                                            <button type="submit" class="btn btn-danger btn-sm"><i class="bi bi-x-lg me-1"></i> Rejeter</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

</div>

<script href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

