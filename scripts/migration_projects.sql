-- 002_migrate_projets_table.sql
-- Ajout de la clé étrangère vers la table categories

-- Étape 1 : Ajouter la nouvelle colonne category_id (nullable temporairement)
ALTER TABLE projets 
ADD COLUMN category_id INT NULL AFTER description,
ADD INDEX idx_category_id (category_id);

-- Étape 2 : Migrer les données existantes (mapping ancien → nouveau)
UPDATE projets p
INNER JOIN categories c ON (
  (p.category = 'routes' AND c.slug = 'routes') OR
  (p.category = 'batiments' AND c.slug = 'batiments') OR
  (p.category = 'ouvrages' AND c.slug = 'ouvrages') OR
  (p.category = 'hydraulique' AND c.slug = 'hydraulique') OR
  (p.category = 'industriel' AND c.slug = 'industriel')
)
SET p.category_id = c.id;

-- Étape 3 : Vérifier que toutes les données ont été migrées
SELECT COUNT(*) as projets_sans_categorie FROM projets WHERE category_id IS NULL;

-- Étape 4 : Rendre la colonne obligatoire et ajouter la contrainte de clé étrangère
ALTER TABLE projets
MODIFY COLUMN category_id INT NOT NULL,
ADD CONSTRAINT fk_projets_category 
  FOREIGN KEY (category_id) REFERENCES categories(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- Étape 5 : Supprimer l'ancienne colonne category (après confirmation)
ALTER TABLE projets DROP COLUMN category;
