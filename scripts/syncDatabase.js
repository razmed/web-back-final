require('dotenv').config();
const { testConnection, syncDatabase, sequelize } = require('../config/db');

async function sync() {
  console.log('\n' + '='.repeat(70));
  console.log('SYNCHRONISATION DE LA BASE DE DONNÉES');
  console.log('='.repeat(70) + '\n');

  try {
    // Test connexion
    await testConnection();

    // Demander confirmation pour reset
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    if (force) {
      console.log('⚠️  MODE FORCE: Toutes les tables seront supprimées et recréées!');
      console.log('   Attendez 3 secondes pour annuler (Ctrl+C)...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Synchroniser
    await syncDatabase(force);

    console.log('\n✅ Synchronisation terminée avec succès\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('');
  } finally {
    await sequelize.close();
  }
}

sync();

