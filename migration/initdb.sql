-- ============================================
-- Script SQL : Création et peuplement de la table appels_offres
-- Base de données : MySQL
-- ============================================

-- Création de la table appels_offres
CREATE TABLE IF NOT EXISTS `appels_offres` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `date_publication` DATETIME NOT NULL,
  `date_echeance` DATETIME NOT NULL,
  `reference` VARCHAR(100) NOT NULL UNIQUE,
  `montant` BIGINT NOT NULL,
  `localisation` VARCHAR(255) NOT NULL,
  `statut` ENUM('actif', 'cloture', 'annule') NOT NULL DEFAULT 'actif',
  `pdf_path` VARCHAR(500),
  `pdf_original_name` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_statut` (`statut`),
  INDEX `idx_date_echeance` (`date_echeance`),
  INDEX `idx_reference` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des données (MySQL assignera automatiquement les IDs)
INSERT INTO `appels_offres` 
  (`titre`, `description`, `date_publication`, `date_echeance`, `reference`, `montant`, `localisation`, `statut`, `pdf_path`, `pdf_original_name`, `created_at`, `updated_at`)
VALUES
  ('kda', 'apoezirazlekmrjazoei', '2025-12-15 00:00:00', '2026-02-27 00:00:00', '26-001', 123456789, 'ALGER', 'actif', '/uploads/appels-offres/couverture-1765789301047-397989162.pdf', 'couverture.pdf', '2025-12-15 09:01:41', '2025-12-15 09:01:41'),
  ('Construction d\'un pont autoroutier', 'Construction d\'un pont autoroutier de 500 mètres reliant Alger à Tipaza', '2024-01-15 00:00:00', '2024-04-15 00:00:00', 'AO-2024-001', 150000000, 'Alger - Tipaza', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Rénovation du réseau d\'assainissement', 'Travaux de rénovation et modernisation du réseau d\'assainissement de la ville de Constantine', '2024-02-15 00:00:00', '2024-05-15 00:00:00', 'AO-2024-002', 85000000, 'Constantine', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Aménagement d\'une zone industrielle', 'Aménagement et viabilisation d\'une zone industrielle de 50 hectares', '2024-03-01 10:00:00', '2024-06-01 23:59:59', 'AO-2024-003', 200000000, 'Oran', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Construction de logements sociaux', 'Construction de 500 logements sociaux avec équipements collectifs', '2024-02-20 08:00:00', '2024-08-20 18:00:00', 'AO-2024-004', 250000000, 'Sétif', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Réhabilitation d\'un barrage', 'Travaux de réhabilitation et mise aux normes du barrage de Taksebt', '2024-01-10 00:00:00', '2024-07-10 00:00:00', 'AO-2024-005', 120000000, 'Tizi Ouzou', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Extension du réseau de tramway', 'Extension de la ligne de tramway sur 15 km avec 20 stations', '2024-03-15 00:00:00', '2024-09-15 00:00:00', 'AO-2024-006', 300000000, 'Annaba', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Modernisation d\'un hôpital universitaire', 'Modernisation et extension du CHU avec nouveaux équipements médicaux', '2024-02-01 00:00:00', '2024-12-01 00:00:00', 'AO-2024-007', 180000000, 'Batna', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('Construction d\'un complexe sportif', 'Construction d\'un complexe sportif olympique avec stade de 40000 places', '2024-04-01 00:00:00', '2025-04-01 00:00:00', 'AO-2024-008', 400000000, 'Blida', 'actif', NULL, NULL, '2025-12-15 10:05:12', '2025-12-15 10:05:12'),
  ('test', 'test', '2025-12-15 00:00:00', '2025-12-25 00:00:00', '123', 987654321, 'Boumerdes', 'annule', '/uploads/appels-offres/liste_entreprises_it_algerie-1765793605022-980716313.pdf', 'liste_entreprises_it_algerie.pdf', '2025-12-15 10:13:25', '2025-12-15 10:13:25');

-- Vérification des données insérées
SELECT COUNT(*) as total_records FROM `appels_offres`;
SELECT * FROM `appels_offres` ORDER BY `id` ASC;

