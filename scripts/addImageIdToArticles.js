// scripts/addImageIdToArticles.js
require('dotenv').config();
const { sequelize } = require('../config/db');

const addImageIdColumn = async () => {
  try {
    console.log('🔄 Ajout du champ image_id à la table articles...\n');

    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS image_id INT NULL 
      AFTER image_principale,
      ADD INDEX IF NOT EXISTS idx_image_id (image_id),
      ADD CONSTRAINT fk_articles_image 
      FOREIGN KEY (image_id) REFERENCES images(id) 
      ON DELETE SET NULL;
    `);

    console.log('✅ Champ image_id ajouté avec succès');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sequelize.close();
    process.exit(1);
  }
};

addImageIdColumn();

