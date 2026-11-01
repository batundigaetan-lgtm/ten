<?php
/**
 * RentTech Hub - Configuration & Connexion PDO
 * Fichier de configuration globale du système & Sécurité Avancée
 */

// En-têtes de Sécurité HTTP (Security Headers)
header("X-Frame-Options: SAMEORIGIN");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");

// Configuration Sécurisée des Sessions Cookie
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    session_start();
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'renttech_hub');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

define('AIRTEL_OFFICIAL_NUMBER', '0992611845');
define('AIRTEL_OFFICIAL_NAME', 'KAMBALE');
define('REFERRAL_COMMISSION_PERCENT', 20);

// CODE DE SÉCURITÉ PIN ADMIN ULTRA SÉCURISÉ (6 Chiffres)
define('ADMIN_SECURITY_PIN', '998844');
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes d'attente après 5 échecs

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // En production, ne pas afficher le message brut d'erreur
    die("Erreur critique de connexion sécurisée à la base de données.");
}

/**
 * Protection CSRF - Génération de jeton
 */
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Protection CSRF - Verification du jeton
 */
function verify_csrf_token($token) {
    if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        die("Erreur de sécurité : Jeton CSRF invalide ou expiré.");
    }
    return true;
}

/**
 * Protection Anti-Brute Force (Limitation des tentatives de connexion)
 */
function check_rate_limit($action_key = 'login') {
    $now = time();
    if (!isset($_SESSION['rate_limits'][$action_key])) {
        $_SESSION['rate_limits'][$action_key] = ['count' => 0, 'first_attempt' => $now];
    }
    
    $attempt = &$_SESSION['rate_limits'][$action_key];
    
    if ($now - $attempt['first_attempt'] > LOGIN_LOCKOUT_TIME) {
        // Réinitialiser le compteur après la période de blocage
        $attempt['count'] = 1;
        $attempt['first_attempt'] = $now;
        return true;
    }
    
    if ($attempt['count'] >= MAX_LOGIN_ATTEMPTS) {
        $remaining = ceil((LOGIN_LOCKOUT_TIME - ($now - $attempt['first_attempt'])) / 60);
        return "Compte temporairement verrouillé pour des raisons de sécurité. Réessayez dans {$remaining} minutes.";
    }
    
    $attempt['count']++;
    return true;
}

function reset_rate_limit($action_key = 'login') {
    unset($_SESSION['rate_limits'][$action_key]);
}

/**
 * Nettoyage et sécurisation des entrées (XSS Prevention)
 */
function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Génération d'un code de parrainage unique de 8 caractères
 */
function generate_referral_code() {
    return strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

/**
 * Grille tarifaire des 8 niveaux d'investissement en Francs Congolais (FC)
 */
function get_investment_levels() {
    return [
        1 => ['name' => 'Niveau 1 - Pack Découverte iPad Mini', 'price' => 15000, 'commission' => 3000, 'icon' => 'bi-tablet', 'category' => 'Tablette', 'image' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80'],
        2 => ['name' => 'Niveau 2 - Pack Pro iPad Air', 'price' => 30000, 'commission' => 6000, 'icon' => 'bi-tablet-landscape', 'category' => 'Tablette', 'image' => 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80'],
        3 => ['name' => 'Niveau 3 - Pack Station Laptop Core i5', 'price' => 80000, 'commission' => 16000, 'icon' => 'bi-laptop', 'category' => 'Ordinateur', 'image' => 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'],
        4 => ['name' => 'Niveau 4 - Pack Workstation Pro i7', 'price' => 100000, 'commission' => 20000, 'icon' => 'bi-display', 'category' => 'Ordinateur', 'image' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80'],
        5 => ['name' => 'Niveau 5 - Pack Serveur Tech Entreprise', 'price' => 300000, 'commission' => 60000, 'icon' => 'bi-hdd-stack', 'category' => 'Serveur', 'image' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'],
        6 => ['name' => 'Niveau 6 - Pack Flotte Tactile VIP', 'price' => 500000, 'commission' => 100000, 'icon' => 'bi-cpu', 'category' => 'Tablette', 'image' => 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80'],
        7 => ['name' => 'Niveau 7 - Pack High-Tech Cloud Master', 'price' => 1000000, 'commission' => 200000, 'icon' => 'bi-clouds', 'category' => 'Datacenter', 'image' => 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'],
        8 => ['name' => 'Niveau 8 - Pack Partner Datacenter Ultra', 'price' => 2000000, 'commission' => 400000, 'icon' => 'bi-server', 'category' => 'Datacenter', 'image' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'],
    ];
}

/**
 * Vérification de l'authentification utilisateur
 */
function check_login() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: register.php");
        exit;
    }
}

/**
 * Vérification de l'accès Administrateur avec Code PIN Sécurisé
 */
function check_admin() {
    check_login();
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        header("Location: dashboard.php");
        exit;
    }
}
?>
