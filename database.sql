-- ============================================================
-- RentTech Hub - Base de Données Relationnelle MySQL / MariaDB
-- Architecture Robuste Anti-Fraude avec Contraintes InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS `renttech_hub` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `renttech_hub`;

-- 1. Table des Utilisateurs & Investisseurs
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `referral_code` VARCHAR(20) NOT NULL UNIQUE,
  `referred_by` VARCHAR(20) DEFAULT NULL,
  `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_invested` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_earned` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_login` DATETIME DEFAULT NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_referral_code` (`referral_code`),
  INDEX `idx_referred_by` (`referred_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des Dépôts Automatiques Mobile Money (MaishaPay API - Airtel, Vodacom, Orange)
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `level_name` VARCHAR(100) DEFAULT NULL,
  `operator` VARCHAR(30) NOT NULL DEFAULT 'AIRTEL',
  `airtel_sender_phone` VARCHAR(30) DEFAULT NULL,
  `proof_image` VARCHAR(255) DEFAULT NULL,
  `transaction_ref` VARCHAR(100) DEFAULT NULL,
  `gateway_txn_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('en_attente', 'approuve', 'rejete') NOT NULL DEFAULT 'en_attente',
  `admin_note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_deposits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_deposit_status` (`status`),
  UNIQUE INDEX `uq_deposit_transaction_ref` (`transaction_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des Retraits Airtel Money
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `airtel_receiver_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('en_attente', 'approuve', 'rejete') NOT NULL DEFAULT 'en_attente',
  `admin_note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `processed_at` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_withdrawals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_withdrawal_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table des Packs de Location Investis
CREATE TABLE IF NOT EXISTS `investments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `pack_name` VARCHAR(100) NOT NULL,
  `pack_level` INT NOT NULL,
  `price` DECIMAL(15, 2) NOT NULL,
  `daily_return` DECIMAL(15, 2) NOT NULL,
  `status` ENUM('actif', 'termine', 'suspendu') NOT NULL DEFAULT 'actif',
  `start_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `end_date` DATETIME DEFAULT NULL,
  CONSTRAINT `fk_investments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table des Commissions de Parrainage (20% Instantanés)
CREATE TABLE IF NOT EXISTS `referral_commissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sponsor_id` INT NOT NULL,
  `referred_id` INT NOT NULL,
  `deposit_id` INT NOT NULL,
  `deposit_amount` DECIMAL(15, 2) NOT NULL,
  `commission_amount` DECIMAL(15, 2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ref_sponsor` FOREIGN KEY (`sponsor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ref_referred` FOREIGN KEY (`referred_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ref_deposit` FOREIGN KEY (`deposit_id`) REFERENCES `deposits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table du Grand Livre Financier (Financial Ledger)
CREATE TABLE IF NOT EXISTS `financial_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('deposit', 'withdrawal', 'investment', 'daily_income', 'referral_bonus') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_financial_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table des Logs de Sécurité & Audit Administration (Protection Anti-Fraude)
CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT DEFAULT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `action` VARCHAR(150) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table des Paramètres Système (Trésorerie Airtel)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des Paramètres de Base RentTech Hub
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('airtel_money_phone', '0992611845'),
('airtel_money_name', 'KAMBALE'),
('min_deposit_amount', '5000'),
('min_withdrawal_amount', '5000'),
('referral_commission_rate', '0.20'),
('admin_default_pin', '998844')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Insertion de l'Administrateur Direction
-- Email: admin@renttech.com | Identifiant: admin | Code PIN: 998844
INSERT INTO `users` (`full_name`, `email`, `phone`, `password_hash`, `referral_code`, `role`, `balance`, `total_invested`, `total_earned`)
VALUES 
('Administrateur Direction', 'admin@renttech.com', '0992611845', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN01', 'admin', 0.00, 0.00, 0.00)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Insertion de 2 utilisateurs d'exemple investisseurs
INSERT INTO `users` (`full_name`, `email`, `phone`, `password_hash`, `referral_code`, `referred_by`, `role`, `balance`, `total_invested`, `total_earned`)
VALUES 
('Kambale Jean-Pierre', 'kambale@renttech.com', '0991234567', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'RT892X4', NULL, 'user', 45000.00, 100000.00, 18000.00),
('Mbuyi Clarisse', 'clarisse@renttech.com', '0997654321', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'RT554Y9', 'RT892X4', 'user', 12000.00, 30000.00, 4800.00)
ON DUPLICATE KEY UPDATE `id` = `id`;
