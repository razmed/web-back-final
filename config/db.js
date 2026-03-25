// config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true
    },
    timezone: '+01:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true
    }
  }
);

// Tester la connexion
const testConnection = async () => {
  try {
    console.log('Test de connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('✗ Impossible de se connecter à la base de données:', error.message);
    return false;
  }
};

// Synchroniser les modèles (MODE SÉCURISÉ)
const syncDatabase = async (force = false) => {
  try {
    console.log('Synchronisation des modèles...');
    
    // ATTENTION : alter: false pour éviter les modifications automatiques dangereuses
    await sequelize.sync({ 
      force: force,  // NE JAMAIS mettre true en production
      alter: false   // DÉSACTIVER pour éviter les problèmes d'index
    });
    
    console.log('✓ Modèles synchronisés avec succès.');
    return true;
  } catch (error) {
    console.error('✗ Erreur lors de la synchronisation:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};

