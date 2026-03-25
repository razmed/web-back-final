-- 001_create_categories_table.sql
-- Création de la table des catégories avec support d'images

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  slug VARCHAR(120) NOT NULL UNIQUE,
  photo LONGBLOB,
  photo_mime_type VARCHAR(50),
  photo_name VARCHAR(255),
  ordre INT DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_actif (actif),
  INDEX idx_ordre (ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pré-remplissage avec les catégories existantes
INSERT INTO categories (nom, description, slug, ordre, actif) VALUES
('Travaux Routiers', 'Construction et réhabilitation d''infrastructures routières modernes, durables et sécurisées pour connecter les territoires.', 'routes', 1, TRUE),
('Bâtiments', 'Édification de structures résidentielles et commerciales de haute qualité, alliant design moderne et fonctionnalité.', 'batiments', 2, TRUE),
('Ouvrages d''Art', 'Conception et construction d''ouvrages d''art exceptionnels : ponts, viaducs et structures monumentales.', 'ouvrages', 3, TRUE),
('Hydraulique', 'Projets de gestion de l''eau, barrages et stations d''épuration pour préserver nos ressources hydriques.', 'hydraulique', 4, TRUE),
('Industriel', 'Développement de complexes industriels performants, sécurisés et respectueux des normes environnementales.', 'industriel', 5, TRUE);


