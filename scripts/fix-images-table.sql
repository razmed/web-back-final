-- fix-images-table.sql
-- Correction de la table images : suppression des index en trop

USE sntp_db;

-- Afficher tous les index actuels
SHOW INDEX FROM images;

-- Supprimer la table et la recréer proprement
DROP TABLE IF EXISTS images;

-- Recréer la table images avec la structure correcte
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  data LONGBLOB NOT NULL COMMENT 'Contenu binaire de l\'image',
  alt_text VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Index unique sur filename
  INDEX idx_filename (filename),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérification
SHOW INDEX FROM images;
SELECT COUNT(*) as total_indexes FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'sntp_db' AND table_name = 'images';

