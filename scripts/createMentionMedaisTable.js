// scripts/createMentionsMediasTable.js
require('dotenv').config();
const { sequelize } = require('../config/db');

const createMentionsMediasTable = async () => {
  try {
    console.log('🔄 Création de la table mentions_medias...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mentions_medias (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500) NOT NULL,
        source VARCHAR(100),
        logo_source VARCHAR(500),
        date_publication DATETIME,
        type ENUM('article', 'video', 'podcast', 'interview', 'communique') NOT NULL DEFAULT 'article',
        statut ENUM('actif', 'archive') NOT NULL DEFAULT 'actif',
        featured BOOLEAN DEFAULT FALSE,
        ordre INT DEFAULT 0,
        createdat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_statut (statut),
        INDEX idx_type (type),
        INDEX idx_featured (featured),
        INDEX idx_date_publication (date_publication)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Table mentions_medias créée avec succès');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createMentionsMediasTable();

