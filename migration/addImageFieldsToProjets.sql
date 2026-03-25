-- migration/addImageFieldsToProjets.sql
-- Migration pour ajouter les champs image en BLOB à la table projets
-- Date : 2025-12-18

USE sntpdb;

-- Ajouter les nouvelles colonnes pour stocker l'image dans la base de données
ALTER TABLE projets
  ADD COLUMN imagedata LONGBLOB COMMENT 'Contenu binaire de l\'image du projet',
  ADD COLUMN imagesize INT COMMENT 'Taille de l\'image en octets',
  ADD COLUMN imagemimetype VARCHAR(100) DEFAULT 'image/jpeg' COMMENT 'Type MIME de l\'image',
  ADD COLUMN imageoriginalname VARCHAR(255) COMMENT 'Nom original du fichier image';

-- L'ancienne colonne `image` reste pour compatibilité temporaire
-- Elle sera utilisée durant la transition

-- Vérification
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sntpdb'
  AND TABLE_NAME = 'projets'
  AND COLUMN_NAME IN ('imagedata', 'imagesize', 'imagemimetype', 'imageoriginalname', 'image');

