// scripts/addMentionFieldsToArticles.js
require('dotenv').config();
const { sequelize } = require('../config/db');

const addMentionFields = async () => {
  try {
    console.log('🔄 Ajout des champs mentions médias à la table articles...');
    
    // Ajouter le champ type_contenu
    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS type_contenu ENUM('article', 'mention_media') 
      DEFAULT 'article' 
      AFTER statut;
    `);
    console.log('✅ Champ type_contenu ajouté');
    
    // Ajouter le champ url_externe (pour les mentions médias)
    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS url_externe VARCHAR(500) 
      AFTER contenu;
    `);
    console.log('✅ Champ url_externe ajouté');
    
    // Ajouter le champ source_media
    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS source_media VARCHAR(100) 
      AFTER url_externe;
    `);
    console.log('✅ Champ source_media ajouté');
    
    // Ajouter le champ logo_source
    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS logo_source VARCHAR(500) 
      AFTER source_media;
    `);
    console.log('✅ Champ logo_source ajouté');
    
    // Ajouter le champ type_media
    await sequelize.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS type_media ENUM('article', 'video', 'podcast', 'interview', 'communique') 
      AFTER logo_source;
    `);
    console.log('✅ Champ type_media ajouté');
    
    // Ajouter index sur type_contenu
    await sequelize.query(`
      ALTER TABLE articles 
      ADD INDEX IF NOT EXISTS idx_type_contenu (type_contenu);
    `);
    console.log('✅ Index sur type_contenu ajouté');
    
    console.log('\n✅ Tous les champs ont été ajoutés avec succès');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sequelize.close();
    process.exit(1);
  }
};

addMentionFields();

