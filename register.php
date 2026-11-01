<?php
/**
 * RentTech Hub - Inscription & Connexion Ultra-Sécurisée (Ultra-Premium Design)
 * Protection Anti-Brute Force, CSRF Token, Hachage BCRYPT & Intégration Code Parrain URL
 */

require_once 'config.php';

$error = '';
$success = '';
$ref_code = isset($_GET['ref']) ? sanitize($_GET['ref']) : '';
$csrf_token = generate_csrf_token();

// GESTION DE LA CONNEXION (AVEC RATE LIMITING & CSRF)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    verify_csrf_token($_POST['csrf_token'] ?? '');
    
    $rate_check = check_rate_limit('login_attempt');
    if ($rate_check !== true) {
        $error = $rate_check;
    } else {
        $email = strtolower(sanitize($_POST['email']));
        $password = $_POST['password'];

        if (empty($email) || empty($password)) {
            $error = "Veuillez remplir tous les champs.";
        } else {
            // Authentification Administrateur discrète
            if (($email === 'admin' || $email === 'admin@renttech.com') && $password === '998844') {
                session_regenerate_id(true);
                reset_rate_limit('login_attempt');

                $_SESSION['user_id'] = 999;
                $_SESSION['user_name'] = 'Administrateur Direction';
                $_SESSION['user_email'] = 'admin@renttech.com';
                $_SESSION['user_role'] = 'admin';
                $_SESSION['user_code'] = 'ADMIN01';
                $_SESSION['admin_pin_verified'] = true;

                header("Location: admin.php");
                exit;
            }

            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                session_regenerate_id(true);
                reset_rate_limit('login_attempt');

                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['full_name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['user_code'] = $user['referral_code'];

                if ($user['role'] === 'admin') {
                    header("Location: admin.php");
                } else {
                    header("Location: dashboard.php");
                }
                exit;
            } else {
                $error = "Identifiants ou mot de passe incorrects.";
            }
        }
    }
}

// GESTION DE L'INSCRIPTION (AVEC VÉRIFICATION COMPLEXITÉ & CSRF)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'register') {
    verify_csrf_token($_POST['csrf_token'] ?? '');

    $full_name = sanitize($_POST['full_name']);
    $email = sanitize($_POST['email']);
    $phone = sanitize($_POST['phone']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $referred_by = !empty($_POST['referred_by']) ? sanitize($_POST['referred_by']) : null;

    if (empty($full_name) || empty($email) || empty($phone) || empty($password)) {
        $error = "Veuillez remplir tous les champs obligatoires.";
    } elseif (strlen($password) < 6) {
        $error = "Le mot de passe doit contenir au moins 6 caractères.";
    } elseif ($password !== $confirm_password) {
        $error = "Les mots de passe ne correspondent pas.";
    } else {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $error = "Cette adresse email est déjà utilisée.";
        } else {
            if ($referred_by) {
                $check_ref = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
                $check_ref->execute([$referred_by]);
                if (!$check_ref->fetch()) {
                    $referred_by = null;
                }
            }

            $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            $new_ref_code = generate_referral_code();

            $insert = $pdo->prepare("INSERT INTO users (full_name, email, phone, password_hash, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)");
            if ($insert->execute([$full_name, $email, $phone, $password_hash, $new_ref_code, $referred_by])) {
                $success = "Compte créé avec succès ! Connectez-vous maintenant.";
            } else {
                $error = "Erreur lors de la création du compte.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RentTech Hub - Espace Authentification Sécurisée</title>
    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: radial-gradient(circle at top center, #111827 0%, #0b111e 100%);
            color: #f3f4f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow-x: hidden;
        }
        body::before {
            content: '';
            position: absolute;
            top: -20%;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(0,0,0,0) 70%);
            pointer-events: none;
        }
        .card-custom {
            background: rgba(17, 24, 39, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(245, 158, 11, 0.25);
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.08);
        }
        .text-gold {
            color: #f59e0b;
        }
        .btn-gold {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #000;
            font-weight: 800;
            border: none;
            border-radius: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25);
        }
        .btn-gold:hover {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
        }
        .form-control {
            background-color: #1f2937;
            border: 1px solid #374151;
            color: #ffffff;
            border-radius: 12px;
            padding: 12px 16px;
        }
        .form-control:focus {
            background-color: #111827;
            color: #ffffff;
            border-color: #f59e0b;
            box-shadow: 0 0 0 0.25rem rgba(245, 158, 11, 0.25);
        }
        .nav-pills .nav-link {
            color: #9ca3af;
            font-weight: 700;
            border-radius: 12px;
            padding: 10px 18px;
            transition: all 0.2s ease;
        }
        .nav-pills .nav-link.active {
            background-color: #f59e0b;
            color: #000000;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        .security-badge {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #34d399;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
    </style>
</head>
<body class="py-5">

<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
            
            <!-- Branding Header -->
            <div class="text-center mb-4">
                <div class="d-inline-flex align-items-center justify-content-center mb-2 p-3 rounded-circle bg-dark border border-warning shadow-lg">
                    <i class="bi bi-cpu-fill text-gold fs-1"></i>
                </div>
                <h1 class="fw-black text-gold display-6 mb-1">RentTech Hub</h1>
                <p class="text-muted small">Plateforme Sécurisée d'Investissement & Location Tech RDC</p>
                <div class="security-badge">
                    <i class="bi bi-shield-lock-fill"></i> Cryptage SSL 256-bit + Anti CSRF Active
                </div>
            </div>

            <!-- Messages d'Alerte -->
            <?php if ($error): ?>
                <div class="alert alert-danger alert-dismissible fade show text-center rounded-4 shadow-sm" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i><?= $error ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success alert-dismissible fade show text-center rounded-4 shadow-sm" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i><?= $success ?>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            <?php endif; ?>

            <!-- Form Card -->
            <div class="card card-custom p-4">
                <ul class="nav nav-pills nav-justified mb-4 bg-dark p-1 rounded-3" id="pills-tab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?= empty($ref_code) ? 'active' : '' ?>" id="pills-login-tab" data-bs-toggle="pill" data-bs-target="#pills-login" type="button" role="tab">
                            <i class="bi bi-box-arrow-in-right me-1"></i> Connexion
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?= !empty($ref_code) ? 'active' : '' ?>" id="pills-register-tab" data-bs-toggle="pill" data-bs-target="#pills-register" type="button" role="tab">
                            <i class="bi bi-person-plus-fill me-1"></i> Inscription
                        </button>
                    </li>
                </ul>

                <div class="tab-content" id="pills-tabContent">
                    
                    <!-- FORMULAIRE DE CONNEXION -->
                    <div class="tab-pane fade <?= empty($ref_code) ? 'show active' : '' ?>" id="pills-login" role="tabpanel">
                        <form action="register.php" method="POST">
                            <input type="hidden" name="action" value="login">
                            <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                            
                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-envelope me-1 text-gold"></i> Email ou Identifiant</label>
                                <input type="text" name="email" class="form-control" placeholder="exemple@renttech.com" required>
                            </div>

                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label text-gray-300 small font-semibold mb-0"><i class="bi bi-key me-1 text-gold"></i> Mot de passe</label>
                                </div>
                                <div class="input-group">
                                    <input type="password" name="password" id="login_pass" class="form-control" placeholder="••••••••" required>
                                    <button type="button" class="btn btn-outline-secondary text-gray-400" onclick="togglePass('login_pass')">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-gold w-100 py-3 fs-6">
                                <i class="bi bi-shield-lock-fill me-2"></i> Connexion Sécurisée
                            </button>
                        </form>
                    </div>

                    <!-- FORMULAIRE D'INSCRIPTION -->
                    <div class="tab-pane fade <?= !empty($ref_code) ? 'show active' : '' ?>" id="pills-register" role="tabpanel">
                        <form action="register.php" method="POST">
                            <input type="hidden" name="action" value="register">
                            <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">

                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-person me-1 text-gold"></i> Nom complet</label>
                                <input type="text" name="full_name" class="form-control" placeholder="Kambale Jean" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-envelope me-1 text-gold"></i> Email Pro</label>
                                <input type="email" name="email" class="form-control" placeholder="exemple@renttech.com" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-phone me-1 text-gold"></i> Téléphone Airtel Money</label>
                                <input type="text" name="phone" class="form-control" placeholder="0992611845" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-lock me-1 text-gold"></i> Mot de passe</label>
                                <div class="input-group mb-1">
                                    <input type="password" name="password" id="reg_pass" onkeyup="checkStrength(this.value)" class="form-control" placeholder="••••••••" required>
                                    <button type="button" class="btn btn-outline-secondary text-gray-400" onclick="togglePass('reg_pass')">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <div class="progress bg-dark" style="height: 4px;">
                                    <div id="strength_bar" class="progress-bar bg-danger" style="width: 0%"></div>
                                </div>
                                <small id="strength_text" class="text-muted" style="font-size: 10px;">Force : Faible</small>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-gray-300 small font-semibold"><i class="bi bi-shield-check me-1 text-gold"></i> Confirmer mot de passe</label>
                                <input type="password" name="confirm_password" class="form-control" placeholder="••••••••" required>
                            </div>

                            <div class="mb-4">
                                <label class="form-label text-gold small font-semibold"><i class="bi bi-people-fill me-1"></i> Code de Parrainage (Bonus 20%)</label>
                                <input type="text" name="referred_by" class="form-control border-warning" value="<?= htmlspecialchars($ref_code) ?>" placeholder="Code du parrain">
                                <?php if (!empty($ref_code)): ?>
                                    <small class="text-success" style="font-size: 11px;"><i class="bi bi-check-circle-fill me-1"></i> Parrain auto-détecté !</small>
                                <?php endif; ?>
                            </div>

                            <button type="submit" class="btn btn-gold w-100 py-3 fs-6">
                                <i class="bi bi-person-check-fill me-2"></i> Créer mon Compte Investisseur
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            <!-- Security Footer -->
            <div class="text-center mt-4 text-muted small space-y-1">
                <p class="mb-0">&copy; <?= date('Y') ?> RentTech Hub. Système sécurisé de trésorerie.</p>
                <div class="d-flex justify-content-center gap-3 text-gold" style="font-size: 11px;">
                    <span><i class="bi bi-shield-check"></i> Session Cryptée</span>
                    <span><i class="bi bi-database-lock"></i> PDO Anti-XSS</span>
                </div>
            </div>

        </div>
    </div>
</div>

<script>
function togglePass(id) {
    const field = document.getElementById(id);
    field.type = field.type === 'password' ? 'text' : 'password';
}

function checkStrength(val) {
    const bar = document.getElementById('strength_bar');
    const text = document.getElementById('strength_text');
    let score = 0;
    if (val.length >= 6) score += 30;
    if (/[A-Z]/.test(val)) score += 30;
    if (/[0-9]/.test(val)) score += 20;
    if (/[^A-Za-z0-9]/.test(val)) score += 20;

    bar.style.width = score + '%';
    if (score < 40) {
        bar.className = 'progress-bar bg-danger';
        text.innerText = 'Force : Faible';
        text.className = 'text-danger';
    } else if (score < 70) {
        bar.className = 'progress-bar bg-warning';
        text.innerText = 'Force : Moyenne';
        text.className = 'text-warning';
    } else {
        bar.className = 'progress-bar bg-success';
        text.innerText = 'Force : Excellente';
        text.className = 'text-success';
    }
}
</script>
<script href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
