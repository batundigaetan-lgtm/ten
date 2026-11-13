<?php
/**
 * RentTech Hub - Tableau de Bord Investisseur
 * Dépôt, Retrait, Matrice des gains, Lien d'affiliation copiable, Navigation mobile
 */

require_once 'config.php';
require_once 'maishapay.php';
check_login();

$user_id = $_SESSION['user_id'];
$message = '';
$error = '';

// Traitement du dépôt automatique par Mobile Money (MaishaPay API - Push USSD/STK)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'deposit') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    $amount = floatval($_POST['amount'] ?? 0);
    $level_name = sanitize($_POST['level_name'] ?? 'Recharge Automatique');
    $phone = sanitize($_POST['phone'] ?? '');
    $operator = sanitize($_POST['operator'] ?? '');

    if ($amount <= 0) {
        $error = "Veuillez entrer un montant valide.";
    } elseif (empty($phone)) {
        $error = "Veuillez spécifier votre numéro Mobile Money pour recevoir le push de validation.";
    } else {
        $res = maishapay_initiate_deposit($pdo, $user_id, $amount, $phone, $operator, $level_name);
        if ($res['ok']) {
            $message = $res['message'];
        } else {
            $error = $res['message'];
        }
    }
}

// Traitement d'une demande de retrait
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'withdraw') {
    $amount = floatval($_POST['amount']);
    $phone_number = sanitize($_POST['phone_number']);

    // Récupération du solde actuel
    $stmt_user = $pdo->prepare("SELECT balance FROM users WHERE id = ?");
    $stmt_user->execute([$user_id]);
    $current_user = $stmt_user->fetch();

    if ($amount <= 0) {
        $error = "Veuillez saisir un montant de retrait valide.";
    } elseif (empty($phone_number)) {
        $error = "Veuillez spécifier le numéro Airtel Money de destination.";
    } elseif ($amount > $current_user['balance']) {
        $error = "Solde insuffisant ! Votre solde actuel est de " . number_format($current_user['balance'], 0, ',', ' ') . " FC.";
    } else {
        $stmt_w = $pdo->prepare("INSERT INTO withdrawals (user_id, amount, phone_number, status) VALUES (?, ?, ?, 'en_attente')");
        if ($stmt_w->execute([$user_id, $amount, $phone_number])) {
            $message = "Votre demande de retrait de " . number_format($amount, 0, ',', ' ') . " FC a été soumise avec succès et est en cours de traitement.";
        } else {
            $error = "Erreur lors de la soumission de la demande de retrait.";
        }
    }
}

// Récupération des données fraîches de l'utilisateur
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$user_id]);
$user = $stmt->fetch();

// Récupération de l'historique des transactions de l'utilisateur
$stmt_dep = $pdo->prepare("SELECT * FROM deposits WHERE user_id = ? ORDER BY id DESC LIMIT 5");
$stmt_dep->execute([$user_id]);
$my_deposits = $stmt_dep->fetchAll();

$stmt_with = $pdo->prepare("SELECT * FROM withdrawals WHERE user_id = ? ORDER BY id DESC LIMIT 5");
$stmt_with->execute([$user_id]);
$my_withdrawals = $stmt_with->fetchAll();

$stmt_logs = $pdo->prepare("SELECT * FROM financial_logs WHERE user_id = ? ORDER BY id DESC LIMIT 10");
$stmt_logs->execute([$user_id]);
$my_logs = $stmt_logs->fetchAll();

// Construction du lien de parrainage dynamique
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$referral_url = $protocol . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/register.php?ref=' . $user['referral_code'];

$levels = get_investment_levels();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentTech Hub - Espace Investisseur</title>
    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background-color: #0b111e;
            color: #f3f4f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding-bottom: 90px; /* Espace pour la barre mobile basse */
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
        .text-gold {
            color: #f59e0b;
        }
        .bg-gold {
            background-color: #f59e0b !important;
            color: #000 !important;
        }
        .btn-gold {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 700;
            border: none;
            transition: all 0.3s ease;
        }
        .btn-gold:hover {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
            box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
        }
        .form-control, .form-select {
            background-color: #1f2937;
            border: 1px solid #374151;
            color: #ffffff;
        }
        .form-control:focus, .form-select:focus {
            background-color: #1f2937;
            color: #ffffff;
            border-color: #f59e0b;
            box-shadow: 0 0 0 0.25rem rgba(245, 158, 11, 0.25);
        }
        /* Mobile Navigation Persistence */
        .mobile-bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #111827;
            border-top: 1px solid #1f2937;
            z-index: 1050;
            display: flex;
            justify-content: space-around;
            padding: 10px 0;
        }
        .mobile-nav-item {
            color: #9ca3af;
            text-decoration: none;
            text-align: center;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .mobile-nav-item i {
            font-size: 1.4rem;
            display: block;
        }
        .mobile-nav-item.active, .mobile-nav-item:hover {
            color: #f59e0b;
        }
        .level-card {
            transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .level-card:hover {
            transform: translateY(-5px);
            border-color: #f59e0b;
        }
    </style>
</head>
<body>

<!-- Header / Navbar Desktop -->
<nav class="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
    <div class="container">
        <a class="navbar-brand fw-bold text-gold fs-4" href="dashboard.php">
            <i class="bi bi-cpu-fill me-2"></i>RentTech Hub
        </a>
        <div class="d-flex align-items-center gap-3">
            <span class="badge bg-secondary p-2"><i class="bi bi-person-fill me-1"></i><?= htmlspecialchars($user['full_name']) ?></span>
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

    <!-- CARTE SOLDE ET RECAPITULATIF -->
    <div class="row g-3 mb-4">
        <div class="col-md-4">
            <div class="card card-custom p-4 text-center">
                <span class="text-muted small uppercase fw-bold"><i class="bi bi-wallet2 me-1"></i> Solde Disponible</span>
                <h2 class="text-gold fw-bold display-6 my-2"><?= number_format($user['balance'], 0, ',', ' ') ?> FC</h2>
                <div class="d-flex justify-content-center gap-2 mt-2">
                    <button class="btn btn-gold btn-sm px-3" data-bs-toggle="modal" data-bs-target="#depositModal"><i class="bi bi-plus-circle me-1"></i> Recharger</button>
                    <button class="btn btn-outline-light btn-sm px-3" data-bs-toggle="modal" data-bs-target="#withdrawModal"><i class="bi bi-arrow-up-right-circle me-1"></i> Retirer</button>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card card-custom p-4 text-center">
                <span class="text-muted small uppercase fw-bold"><i class="bi bi-graph-up me-1"></i> Total Investi</span>
                <h3 class="text-white fw-bold my-2"><?= number_format($user['total_invested'], 0, ',', ' ') ?> FC</h3>
                <small class="text-muted">Projets & Packs de location</small>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card card-custom p-4 text-center">
                <span class="text-muted small uppercase fw-bold"><i class="bi bi-people-fill me-1"></i> Gains de Parrainage (20%)</span>
                <h3 class="text-success fw-bold my-2"><?= number_format($user['total_earned'], 0, ',', ' ') ?> FC</h3>
                <small class="text-muted">Commissions réseau directes</small>
            </div>
        </div>
    </div>

    <!-- PANNEAU PARRAINAGE & LIEN D'AFFILIATION -->
    <div class="card card-custom p-4 mb-4">
        <h5 class="text-gold fw-bold mb-3"><i class="bi bi-share-fill me-2"></i> Votre Lien d'Affiliation Exclusif (20% de Commission)</h5>
        <p class="text-muted small mb-3">Partagez ce lien avec vos filleuls. Vous recevrez instantanément 20% sur chacun de leurs dépôts approuvés par la plateforme !</p>
        <div class="input-group">
            <input type="text" id="affiliateLink" class="form-control fw-bold" value="<?= $referral_url ?>" readonly>
            <button class="btn btn-gold px-4" onclick="copyAffiliateLink()"><i class="bi bi-clipboard me-1"></i> Copier le Lien</button>
        </div>
        <div id="copySuccess" class="text-success small mt-2 fw-bold" style="display: none;"><i class="bi bi-check-all me-1"></i> Lien copié dans le presse-papier !</div>
    </div>

    <!-- CONSIGNES DE RECHARGE MOBILE MONEY AUTOMATIQUE MAISHAPAY -->
    <div class="card card-custom p-4 mb-4 border-warning">
        <div class="d-flex align-items-center mb-3">
            <i class="bi bi-phone-vibrate text-gold fs-1 me-3"></i>
            <div>
                <h5 class="text-gold fw-bold mb-1">Recharge Automatique & Instantanée via MaishaPay</h5>
                <p class="text-muted small mb-0">Plus besoin de transfert manuel ni de capture d'écran ! Indiquez votre numéro et validez le push directement sur votre téléphone avec votre code secret Mobile Money.</p>
            </div>
        </div>
        <div class="bg-dark p-3 rounded-3 border border-secondary">
            <div class="row align-items-center text-center text-md-start g-3">
                <div class="col-md-5">
                    <span class="text-muted small">Réseaux Supportés en RDC :</span>
                    <div class="text-white fw-bold d-flex flex-wrap align-items-center gap-2 mt-1">
                        <span class="badge bg-danger"><i class="bi bi-broadcast me-1"></i> Airtel Money</span>
                        <span class="badge bg-primary"><i class="bi bi-phone me-1"></i> Vodacom M-Pesa</span>
                        <span class="badge bg-warning text-dark"><i class="bi bi-wallet2 me-1"></i> Orange Money</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <span class="text-muted small">Délai d'exécution :</span>
                    <h5 class="text-success fw-bold mb-0"><i class="bi bi-lightning-charge-fill me-1"></i> Push Instantané (5 - 30s)</h5>
                </div>
                <div class="col-md-3 text-md-end">
                    <button class="btn btn-gold fw-bold w-100 py-2" data-bs-toggle="modal" data-bs-target="#depositModal">
                        <i class="bi bi-phone-vibrate me-1"></i> Recharger
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- MATRICE DES GAINS & SELECTION DE NIVEAUX -->
    <h4 class="text-gold fw-bold mb-3"><i class="bi bi-grid-3x3-gap-fill me-2"></i> Grille d'Investissement & Flotte de Matériel Tech</h4>
    <div class="row g-3 mb-5">
        <?php foreach ($levels as $lvl_id => $lvl): ?>
            <div class="col-md-6 col-lg-3">
                <div class="card card-custom level-card overflow-hidden h-100 flex-column justify-between">
                    <div class="position-relative" style="height: 160px; overflow: hidden;">
                        <img src="<?= $lvl['image'] ?>" alt="<?= htmlspecialchars($lvl['name']) ?>" class="w-100 h-100 object-fit-cover">
                        <span class="position-absolute top-0 start-0 m-2 badge bg-dark text-gold border border-warning"><?= $lvl['category'] ?></span>
                    </div>
                    <div class="p-3 text-center flex-grow-1 flex-column justify-between">
                        <h6 class="fw-bold text-white mb-1"><?= $lvl['name'] ?></h6>
                        <h4 class="text-gold fw-bold my-2"><?= number_format($lvl['price'], 0, ',', ' ') ?> FC</h4>
                        <div class="badge bg-success mb-3 p-2 w-100">Commission Parrain (20%) : <?= number_format($lvl['commission'], 0, ',', ' ') ?> FC</div>
                        <button class="btn btn-gold btn-sm w-100 fw-bold" onclick="selectLevel('<?= addslashes($lvl['name']) ?>', <?= $lvl['price'] ?>)" data-bs-toggle="modal" data-bs-target="#depositModal">
                            Investir / Recharger
                        </button>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- HISTORIQUE DES TRANSACTIONS -->
    <div class="card card-custom p-4 mb-4">
        <h5 class="text-gold fw-bold mb-3"><i class="bi bi-journal-text me-2"></i> Historique de vos Opérations</h5>
        <ul class="nav nav-tabs nav-fill mb-3" id="transTabs" role="tablist">
            <li class="nav-item">
                <button class="nav-link active text-white" id="dep-tab" data-bs-toggle="tab" data-bs-target="#myDeps" type="button">Mes Dépôts</button>
            </li>
            <li class="nav-item">
                <button class="nav-link text-white" id="with-tab" data-bs-toggle="tab" data-bs-target="#myWiths" type="button">Mes Retraits</button>
            </li>
        </ul>

        <div class="tab-content">
            <div class="tab-pane fade show active" id="myDeps">
                <div class="table-responsive">
                    <table class="table table-dark table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Pack</th>
                                <th>Montant</th>
                                <th>Opérateur</th>
                                <th>Référence</th>
                                <th>Statut</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($my_deposits)): ?>
                                <tr><td colspan="6" class="text-center text-muted">Aucun dépôt effectué pour le moment.</td></tr>
                            <?php else: ?>
                                <?php foreach ($my_deposits as $d): ?>
                                    <tr>
                                        <td><?= htmlspecialchars($d['level_name'] ?? 'Recharge') ?></td>
                                        <td class="fw-bold text-gold"><?= number_format($d['amount'], 0, ',', ' ') ?> FC</td>
                                        <td>
                                            <?php 
                                            $op = strtoupper($d['operator'] ?? 'AIRTEL');
                                            if ($op === 'AIRTEL'): ?>
                                                <span class="badge bg-danger">Airtel</span>
                                            <?php elseif ($op === 'MPESA'): ?>
                                                <span class="badge bg-primary">M-Pesa</span>
                                            <?php elseif ($op === 'ORANGE'): ?>
                                                <span class="badge bg-warning text-dark">Orange</span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary"><?= htmlspecialchars($op) ?></span>
                                            <?php endif; ?>
                                        </td>
                                        <td><code class="text-info small"><?= htmlspecialchars($d['transaction_ref'] ?: 'DEP-' . $d['id']) ?></code></td>
                                        <td>
                                            <?php if ($d['status'] === 'en_attente'): ?>
                                                <span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i> En attente PIN</span>
                                            <?php elseif ($d['status'] === 'approuve'): ?>
                                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Validé</span>
                                            <?php else: ?>
                                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> Rejeté</span>
                                            <?php endif; ?>
                                        </td>
                                        <td><?= date('d/m/Y H:i', strtotime($d['created_at'])) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="tab-pane fade" id="myWiths">
                <div class="table-responsive">
                    <table class="table table-dark table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Montant</th>
                                <th>Téléphone Destination</th>
                                <th>Statut</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($my_withdrawals)): ?>
                                <tr><td colspan="4" class="text-center text-muted">Aucun retrait effectué.</td></tr>
                            <?php else: ?>
                                <?php foreach ($my_withdrawals as $w): ?>
                                    <tr>
                                        <td class="fw-bold text-danger"><?= number_format($w['amount'], 0, ',', ' ') ?> FC</td>
                                        <td><?= htmlspecialchars($w['phone_number']) ?></td>
                                        <td>
                                            <?php if ($w['status'] === 'en_attente'): ?>
                                                <span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i> En attente</span>
                                            <?php elseif ($w['status'] === 'approuve'): ?>
                                                <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i> Effectué</span>
                                            <?php else: ?>
                                                <span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i> Rejeté</span>
                                            <?php endif; ?>
                                        </td>
                                        <td><?= date('d/m/Y H:i', strtotime($w['created_at'])) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

</div>

<!-- MODAL DEPOT / RECHARGE AUTOMATIQUE MAISHAPAY -->
<div class="modal fade" id="depositModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content card-custom text-white">
            <div class="modal-header border-secondary">
                <h5 class="modal-title text-gold fw-bold"><i class="bi bi-phone-vibrate me-2"></i> Recharge Mobile Money Instantanée</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <form id="depositForm" action="dashboard.php" method="POST">
                <input type="hidden" name="action" value="deposit">
                <input type="hidden" name="csrf_token" value="<?= generate_csrf_token() ?>">
                
                <div class="modal-body">
                    <!-- Statut interactif du Push USSD / Mobile Money -->
                    <div id="pushStatusBox" class="p-3 mb-3 rounded-3 border bg-dark" style="display: none;">
                        <div class="d-flex align-items-center gap-3">
                            <div class="spinner-border text-warning spinner-border-sm" role="status" id="pushSpinner"></div>
                            <div>
                                <h6 class="fw-bold mb-1 text-white" id="pushStatusTitle">Demande en cours...</h6>
                                <p class="small mb-0 text-muted" id="pushStatusDesc">Connexion sécurisée à MaishaPay...</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Nom du Pack / Destination</label>
                        <input type="text" id="modalLevelName" name="level_name" class="form-control" value="Recharge Automatique" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Réseau Mobile Money</label>
                        <select id="modalOperator" name="operator" class="form-select bg-dark text-white border-secondary">
                            <option value="AIRTEL">Airtel Money (097, 098, 099)</option>
                            <option value="MPESA">Vodacom M-Pesa (081, 082, 083)</option>
                            <option value="ORANGE">Orange Money (084, 085, 089, 080)</option>
                            <option value="AFRICELL">Africell Money (090, 091)</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Numéro de téléphone Mobile Money</label>
                        <div class="input-group">
                            <span class="input-group-text bg-dark text-gold border-secondary"><i class="bi bi-telephone-fill"></i></span>
                            <input type="tel" id="modalPhone" name="phone" class="form-control" placeholder="ex: 0992611845" value="<?= htmlspecialchars($user['phone'] ?? '') ?>" required>
                        </div>
                        <small class="text-muted" id="phoneHint">C'est sur ce numéro que vous recevrez la notification push pour taper votre code PIN.</small>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small text-muted">Montant à recharger (FC)</label>
                        <div class="input-group">
                            <span class="input-group-text bg-dark text-gold border-secondary">FC</span>
                            <input type="number" id="modalAmount" name="amount" class="form-control fw-bold" placeholder="ex: 15000" min="5000" required>
                        </div>
                    </div>

                    <div class="p-3 bg-dark rounded-3 border border-secondary text-muted small">
                        <i class="bi bi-shield-lock-fill text-gold me-1"></i>
                        <strong>Paiement 100% Automatique :</strong> Plus besoin d'envoyer de capture d'écran ! Dès que vous lancez la demande, un prompt apparaît sur votre écran de téléphone pour entrer votre code secret Mobile Money.
                    </div>
                </div>

                <div class="modal-footer border-secondary">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="submit" id="btnSubmitDeposit" class="btn btn-gold fw-bold">
                        <i class="bi bi-phone-vibrate me-1"></i> Lancer la Recharge
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- MODAL RETRAIT -->
<div class="modal fade" id="withdrawModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content card-custom text-white">
            <div class="modal-header border-secondary">
                <h5 class="modal-title text-gold fw-bold"><i class="bi bi-cash-stack me-2"></i> Demande de Retrait d'Argent</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form action="dashboard.php" method="POST">
                <input type="hidden" name="action" value="withdraw">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Montant du retrait (FC)</label>
                        <input type="number" name="amount" class="form-control" placeholder="ex: 10000" max="<?= $user['balance'] ?>" required>
                        <small class="text-muted">Solde disponible : <?= number_format($user['balance'], 0, ',', ' ') ?> FC</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Numéro Airtel Money de Réception</label>
                        <input type="text" name="phone_number" class="form-control" value="<?= htmlspecialchars($user['phone']) ?>" required>
                    </div>
                </div>
                <div class="modal-footer border-secondary">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="submit" class="btn btn-gold"><i class="bi bi-arrow-up-right-circle me-1"></i> Valider le Retrait</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- NAV BARRE PERSISTANTE MOBILE (App-Like) -->
<div class="mobile-bottom-nav d-md-none">
    <a href="dashboard.php" class="mobile-nav-item active">
        <i class="bi bi-speedometer2"></i>
        <span>Tableau de bord</span>
    </a>
    <a href="#" class="mobile-nav-item text-gold" data-bs-toggle="modal" data-bs-target="#depositModal">
        <i class="bi bi-plus-circle-fill"></i>
        <span>Dépôt Rapide</span>
    </a>
    <a href="#" class="mobile-nav-item" data-bs-toggle="modal" data-bs-target="#withdrawModal">
        <i class="bi bi-arrow-up-right-circle"></i>
        <span>Retrait</span>
    </a>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script>
    function copyAffiliateLink() {
        var copyText = document.getElementById("affiliateLink");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);

        var successMsg = document.getElementById("copySuccess");
        successMsg.style.display = "block";
        setTimeout(function() {
            successMsg.style.display = "none";
        }, 3000);
    }

    function selectLevel(name, price) {
        document.getElementById('modalLevelName').value = name;
        document.getElementById('modalAmount').value = price;
    }

    // Auto-détection dynamique de l'opérateur selon le numéro saisi
    const phoneInput = document.getElementById('modalPhone');
    const operatorSelect = document.getElementById('modalOperator');
    if (phoneInput && operatorSelect) {
        phoneInput.addEventListener('input', function() {
            const val = this.value.replace(/[^0-9]/g, '');
            let prefix = '';
            if (val.startsWith('243') && val.length >= 5) {
                prefix = '0' + val.substring(3, 5);
            } else if (val.startsWith('0') && val.length >= 3) {
                prefix = val.substring(0, 3);
            } else if (val.length >= 2) {
                prefix = '0' + val.substring(0, 2);
            }

            if (['097', '098', '099'].includes(prefix)) {
                operatorSelect.value = 'AIRTEL';
            } else if (['081', '082', '083'].includes(prefix)) {
                operatorSelect.value = 'MPESA';
            } else if (['084', '085', '089', '080'].includes(prefix)) {
                operatorSelect.value = 'ORANGE';
            } else if (['090', '091'].includes(prefix)) {
                operatorSelect.value = 'AFRICELL';
            }
        });
    }

    // Gestion asynchrone du Push Mobile Money via AJAX & Polling en direct
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const statusBox = document.getElementById('pushStatusBox');
            const statusTitle = document.getElementById('pushStatusTitle');
            const statusDesc = document.getElementById('pushStatusDesc');
            const spinner = document.getElementById('pushSpinner');
            const btnSubmit = document.getElementById('btnSubmitDeposit');

            statusBox.style.display = 'block';
            statusBox.className = 'p-3 mb-3 rounded-3 border border-warning bg-dark';
            spinner.style.display = 'inline-block';
            spinner.className = 'spinner-border text-warning spinner-border-sm';
            statusTitle.className = 'fw-bold mb-1 text-warning';
            statusTitle.textContent = "Initiation du paiement push...";
            statusDesc.textContent = "Communication avec les serveurs de l'opérateur...";
            btnSubmit.disabled = true;

            const formData = new FormData(depositForm);
            formData.append('action', 'initiate');

            fetch('api_deposit.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (!data.ok) {
                    statusBox.className = 'p-3 mb-3 rounded-3 border border-danger bg-dark';
                    spinner.style.display = 'none';
                    statusTitle.className = 'fw-bold mb-1 text-danger';
                    statusTitle.textContent = "Échec de l'initiation";
                    statusDesc.textContent = data.message || "Impossible d'initier le paiement.";
                    btnSubmit.disabled = false;
                    return;
                }

                // Cas 1 : Succès immédiat (ex: mode Sandbox / Test)
                if (data.etat === 'reussi') {
                    statusBox.className = 'p-3 mb-3 rounded-3 border border-success bg-dark';
                    spinner.style.display = 'none';
                    statusTitle.className = 'fw-bold mb-1 text-success';
                    statusTitle.textContent = "Simulation terminée (aucun paiement réel)";
                    statusDesc.textContent = data.message;
                    setTimeout(() => { window.location.reload(); }, 2000);
                    return;
                }

                // Cas 2 : Push envoyé (Mode Production / Attente du PIN)
                statusBox.className = 'p-3 mb-3 rounded-3 border border-info bg-dark';
                statusTitle.className = 'fw-bold mb-1 text-info';
                statusTitle.textContent = "📱 Push Mobile Money Envoyé !";
                statusDesc.textContent = "Regardez votre téléphone : un message vient d'apparaître pour taper votre code PIN secret Mobile Money.";

                const ref = data.reference;
                let attempts = 0;
                const maxAttempts = 40; // 40 * 3s = 2 minutes de surveillance
                const interval = setInterval(() => {
                    attempts++;
                    fetch('api_deposit.php?action=check&reference=' + encodeURIComponent(ref))
                    .then(r => r.json())
                    .then(chk => {
                        if (chk.status === 'approuve') {
                            clearInterval(interval);
                            statusBox.className = 'p-3 mb-3 rounded-3 border border-success bg-dark';
                            spinner.style.display = 'none';
                            statusTitle.className = 'fw-bold mb-1 text-success';
                            statusTitle.textContent = "✅ Paiement Confirmé & Solde Crédité !";
                            statusDesc.textContent = "Votre compte a été crédité avec succès ! Actualisation en cours...";
                            setTimeout(() => { window.location.reload(); }, 1800);
                        } else if (chk.status === 'rejete') {
                            clearInterval(interval);
                            statusBox.className = 'p-3 mb-3 rounded-3 border border-danger bg-dark';
                            spinner.style.display = 'none';
                            statusTitle.className = 'fw-bold mb-1 text-danger';
                            statusTitle.textContent = "❌ Transaction Annulée ou Refusée";
                            statusDesc.textContent = chk.message || "Paiement non validé par l'opérateur.";
                            btnSubmit.disabled = false;
                        } else if (attempts >= maxAttempts) {
                            clearInterval(interval);
                            statusTitle.textContent = "⏳ Délai d'attente dépassé";
                            statusDesc.textContent = "Si vous avez validé sur votre téléphone, votre solde sera crédité automatiquement d'ici quelques instants.";
                            btnSubmit.disabled = false;
                        }
                    })
                    .catch(() => {});
                }, 3000);
            })
            .catch(err => {
                statusBox.className = 'p-3 mb-3 rounded-3 border border-danger bg-dark';
                spinner.style.display = 'none';
                statusTitle.className = 'fw-bold mb-1 text-danger';
                statusTitle.textContent = "Erreur de connexion";
                statusDesc.textContent = "Vérifiez votre connexion internet et réessayez.";
                btnSubmit.disabled = false;
            });
        });
    }
</script>
</body>
</html>
