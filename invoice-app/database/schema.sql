-- =====================================================================
-- Invoice & Quotation Management System — Database Schema
-- MySQL 8.0+, InnoDB, utf8mb4
--
-- This file is self-contained: running it against an empty database
-- creates everything, including a minimal `users` table matching
-- Laravel's default migration. If you already have a Laravel app with
-- `php artisan migrate` already run, skip the `users` block below and
-- use database/migrations/ instead — those assume `users` already
-- exists and only extend the schema around it.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- users  (standard Laravel default — included for a standalone run)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- company_settings — single-row table holding the business identity
-- printed on every PDF (logo, address, ICE, default tax rate). Kept
-- separate from `users` because multiple staff logins should all issue
-- documents under the same company identity.
-- ---------------------------------------------------------------------
CREATE TABLE company_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    ice VARCHAR(30) NULL,
    logo_path VARCHAR(255) NULL,
    default_currency CHAR(3) NOT NULL DEFAULT 'MAD',
    default_tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    invoice_footer_note TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ice VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY clients_ice_unique (ice),
    KEY clients_name_index (name),
    KEY clients_email_index (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------
CREATE TABLE articles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    stock_alert_threshold INT NOT NULL DEFAULT 5,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY articles_reference_unique (reference),
    KEY articles_name_index (name),
    KEY articles_category_index (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: "quantity sold" is intentionally NOT a stored column — it's
-- derived from SUM(facture_lignes.quantity) so it can never drift out
-- of sync with actual invoice history.

-- ---------------------------------------------------------------------
-- devis (quotations)
-- ---------------------------------------------------------------------
CREATE TABLE devis (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    reference VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status ENUM('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
    comment TEXT NULL,

    -- Snapshot of client details at time of issue: a quotation/invoice is
    -- a legal document, so it must keep showing the client's info exactly
    -- as it was on the day it was issued, even if the client record
    -- changes later.
    client_name VARCHAR(255) NULL,
    client_address VARCHAR(255) NULL,
    client_phone VARCHAR(30) NULL,
    client_email VARCHAR(255) NULL,
    client_ice VARCHAR(30) NULL,

    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'MAD',

    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY devis_reference_unique (reference),
    KEY devis_status_date_index (status, date),
    CONSTRAINT devis_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT devis_client_id_foreign FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- devis_lignes
-- ---------------------------------------------------------------------
CREATE TABLE devis_lignes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    devis_id BIGINT UNSIGNED NOT NULL,
    article_id BIGINT UNSIGNED NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    total_ht DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_ttc DECIMAL(12,2) NOT NULL DEFAULT 0,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT devis_lignes_devis_id_foreign FOREIGN KEY (devis_id) REFERENCES devis (id) ON DELETE CASCADE,
    CONSTRAINT devis_lignes_article_id_foreign FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- facture (invoices)
-- ---------------------------------------------------------------------
CREATE TABLE facture (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    devis_id BIGINT UNSIGNED NULL,
    reference VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    due_date DATE NULL,
    payment_status ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    comment TEXT NULL,

    client_name VARCHAR(255) NULL,
    client_address VARCHAR(255) NULL,
    client_phone VARCHAR(30) NULL,
    client_email VARCHAR(255) NULL,
    client_ice VARCHAR(30) NULL,

    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'MAD',

    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY facture_reference_unique (reference),
    KEY facture_payment_status_date_index (payment_status, date),
    CONSTRAINT facture_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT facture_client_id_foreign FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT,
    CONSTRAINT facture_devis_id_foreign FOREIGN KEY (devis_id) REFERENCES devis (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Overdue" is intentionally not a stored status — it's computed as
-- (payment_status != 'paid' AND due_date < today) wherever it's shown,
-- so it never needs a background job to keep it in sync.

-- ---------------------------------------------------------------------
-- facture_lignes
-- ---------------------------------------------------------------------
CREATE TABLE facture_lignes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    facture_id BIGINT UNSIGNED NOT NULL,
    article_id BIGINT UNSIGNED NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tva_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    total_ht DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_ttc DECIMAL(12,2) NOT NULL DEFAULT 0,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT facture_lignes_facture_id_foreign FOREIGN KEY (facture_id) REFERENCES facture (id) ON DELETE CASCADE,
    CONSTRAINT facture_lignes_article_id_foreign FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Link a devis to the invoice it became (added after `facture` exists,
-- since the two tables reference each other).
-- ---------------------------------------------------------------------
ALTER TABLE devis
    ADD COLUMN converted_to_facture_id BIGINT UNSIGNED NULL AFTER status,
    ADD CONSTRAINT devis_converted_to_facture_id_foreign
        FOREIGN KEY (converted_to_facture_id) REFERENCES facture (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- Triggers: defense-in-depth safety net. Stock is decremented from the
-- application layer (ArticleService, Phase 2), but the database itself
-- should never accept a negative quantity even if that path is bypassed.
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_articles_prevent_negative_stock_ins
BEFORE INSERT ON articles
FOR EACH ROW
BEGIN
    IF NEW.quantity_in_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock quantity cannot be negative';
    END IF;
END$$

CREATE TRIGGER trg_articles_prevent_negative_stock_upd
BEFORE UPDATE ON articles
FOR EACH ROW
BEGIN
    IF NEW.quantity_in_stock < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock quantity cannot be negative';
    END IF;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Sample seed data
-- No seed *user* is inserted here — passwords must be hashed through
-- Laravel's Hash::make(), not raw SQL. Create your first login with
-- `php artisan tinker` once the app is running. devis/facture below use
-- user_id = NULL (nullable column) since there's no seeded user to
-- attribute them to.
-- =====================================================================

INSERT INTO company_settings (id, company_name, address, phone, email, ice, default_currency, default_tva_rate, invoice_footer_note, created_at, updated_at) VALUES
(1, 'Atlas Office Solutions SARL', '12 Avenue Mohammed V, Casablanca', '+212 522 000 000', 'contact@atlas-office.ma', '001122334000067', 'MAD', 20.00, 'Paiement à 30 jours. RIB : 007 780 0001234567890012 34.', NOW(), NOW());

INSERT INTO clients (id, name, ice, address, phone, email, created_at, updated_at) VALUES
(1, 'Atlas Trading SARL', '001234567000045', '45 Boulevard Zerktouni, Casablanca', '+212 522 111 222', 'contact@atlas-trading.ma', NOW(), NOW()),
(2, 'Sahara Import Export', '001987654000078', '8 Rue Patrice Lumumba, Rabat', '+212 537 333 444', 'info@sahara-ie.ma', NOW(), NOW()),
(3, 'Green Valley Distribution', '001456789000012', '21 Route de l''Aéroport, Marrakech', '+212 524 555 666', 'contact@greenvalley.ma', NOW(), NOW());

INSERT INTO articles (id, name, reference, category, unit_price, tva_rate, quantity_in_stock, stock_alert_threshold, created_at, updated_at) VALUES
(1, 'Laptop Dell Latitude 5440', 'ART-0001', 'Informatique', 8500.00, 20.00, 12, 5, NOW(), NOW()),
(2, 'Souris sans fil Logitech', 'ART-0002', 'Informatique', 150.00, 20.00, 40, 10, NOW(), NOW()),
(3, 'Bureau ergonomique', 'ART-0003', 'Mobilier', 1200.00, 20.00, 8, 3, NOW(), NOW()),
(4, 'Chaise de bureau', 'ART-0004', 'Mobilier', 950.00, 20.00, 3, 5, NOW(), NOW()),
(5, 'Formation utilisateur (jour)', 'ART-0005', 'Services', 3000.00, 20.00, 100, 0, NOW(), NOW());

-- Quotation 1: Atlas Trading — accepted, will be converted below
INSERT INTO devis (id, user_id, client_id, reference, date, status, client_name, client_address, client_phone, client_email, client_ice, subtotal, discount_total, tax_total, total, created_at, updated_at) VALUES
(1, NULL, 1, 'DEV-2026-0001', '2026-07-10', 'accepted', 'Atlas Trading SARL', '45 Boulevard Zerktouni, Casablanca', '+212 522 111 222', 'contact@atlas-trading.ma', '001234567000045', 17750.00, 75.00, 3535.00, 21210.00, NOW(), NOW());

INSERT INTO devis_lignes (devis_id, article_id, description, quantity, unit_price, discount_percent, tva_rate, total_ht, total_ttc, sort_order, created_at, updated_at) VALUES
(1, 1, 'Laptop Dell Latitude 5440', 2, 8500.00, 0, 20.00, 17000.00, 20400.00, 1, NOW(), NOW()),
(1, 2, 'Souris sans fil Logitech', 5, 150.00, 10, 20.00, 675.00, 810.00, 2, NOW(), NOW());

-- Quotation 2: Sahara Import Export — accepted, NOT yet converted
INSERT INTO devis (id, user_id, client_id, reference, date, status, client_name, client_address, client_phone, client_email, client_ice, subtotal, discount_total, tax_total, total, created_at, updated_at) VALUES
(2, NULL, 2, 'DEV-2026-0002', '2026-07-15', 'accepted', 'Sahara Import Export', '8 Rue Patrice Lumumba, Rabat', '+212 537 333 444', 'info@sahara-ie.ma', '001987654000078', 7400.00, 180.00, 1444.00, 8664.00, NOW(), NOW());

INSERT INTO devis_lignes (devis_id, article_id, description, quantity, unit_price, discount_percent, tva_rate, total_ht, total_ttc, sort_order, created_at, updated_at) VALUES
(2, 3, 'Bureau ergonomique', 3, 1200.00, 5, 20.00, 3420.00, 4104.00, 1, NOW(), NOW()),
(2, 4, 'Chaise de bureau', 4, 950.00, 0, 20.00, 3800.00, 4560.00, 2, NOW(), NOW());

-- Invoice 1: converted from DEV-2026-0001 — paid
INSERT INTO facture (id, user_id, client_id, devis_id, reference, date, due_date, payment_status, amount_paid, client_name, client_address, client_phone, client_email, client_ice, subtotal, discount_total, tax_total, total, created_at, updated_at) VALUES
(1, NULL, 1, 1, 'FAC-2026-0001', '2026-07-12', '2026-08-11', 'paid', 21210.00, 'Atlas Trading SARL', '45 Boulevard Zerktouni, Casablanca', '+212 522 111 222', 'contact@atlas-trading.ma', '001234567000045', 17750.00, 75.00, 3535.00, 21210.00, NOW(), NOW());

INSERT INTO facture_lignes (facture_id, article_id, description, quantity, unit_price, discount_percent, tva_rate, total_ht, total_ttc, sort_order, created_at, updated_at) VALUES
(1, 1, 'Laptop Dell Latitude 5440', 2, 8500.00, 0, 20.00, 17000.00, 20400.00, 1, NOW(), NOW()),
(1, 2, 'Souris sans fil Logitech', 5, 150.00, 10, 20.00, 675.00, 810.00, 2, NOW(), NOW());

UPDATE devis SET converted_to_facture_id = 1 WHERE id = 1;

-- Invoice 2: standalone, no source quotation — unpaid
INSERT INTO facture (id, user_id, client_id, devis_id, reference, date, due_date, payment_status, amount_paid, client_name, client_address, client_phone, client_email, client_ice, subtotal, discount_total, tax_total, total, created_at, updated_at) VALUES
(2, NULL, 3, NULL, 'FAC-2026-0002', '2026-07-20', '2026-08-19', 'unpaid', 0.00, 'Green Valley Distribution', '21 Route de l''Aéroport, Marrakech', '+212 524 555 666', 'contact@greenvalley.ma', '001456789000012', 11500.00, 0.00, 2300.00, 13800.00, NOW(), NOW());

INSERT INTO facture_lignes (facture_id, article_id, description, quantity, unit_price, discount_percent, tva_rate, total_ht, total_ttc, sort_order, created_at, updated_at) VALUES
(2, 5, 'Formation utilisateur (jour)', 1, 3000.00, 0, 20.00, 3000.00, 3600.00, 1, NOW(), NOW()),
(2, 1, 'Laptop Dell Latitude 5440', 1, 8500.00, 0, 20.00, 8500.00, 10200.00, 2, NOW(), NOW());