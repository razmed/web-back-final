require('dotenv').config();
const { testConnection, syncDatabase, sequelize } = require('../config/db');
const AppelOffre = require('../models/AppelOffre');

async function testDB() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST DE CONNEXION À LA BASE DE DONNÉES');
  console.log('='.repeat(70) + '\n');

  try {
    // Test de connexion
    console.log('📡 Test de connexion...');
    const connected = await testConnection();

    if (!connected) {
      console.log('\n❌ Échec de la connexion\n');
      return;
    }

    // Afficher les informations de connexion
    console.log('\n📋 Informations de connexion:');
    console.log(`   Host: ${sequelize.config.host}`);
    console.log(`   Port: ${sequelize.config.port}`);
    console.log(`   Database: ${sequelize.config.database}`);
    console.log(`   Dialect: ${sequelize.config.dialect}`);

    // Synchroniser les modèles
    console.log('\n🔄 Synchronisation des modèles...');
    await syncDatabase(false);

    // Compter les enregistrements
    console.log('\n📊 Données actuelles:');
    const count = await AppelOffre.count();
    console.log(`   Appels d'offres: ${count}`);

    if (count > 0) {
      const stats = await AppelOffre.getStatistics();
      console.log(`   - Actifs: ${stats.actifs}`);
      console.log(`   - Expirés: ${stats.expires}`);
      console.log(`   - Annulés: ${stats.annules}`);
    }

    console.log('\n✅ Tout fonctionne correctement!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('');
  } finally {
    await sequelize.close();
  }
}

testDB();

