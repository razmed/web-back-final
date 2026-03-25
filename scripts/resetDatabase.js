require('dotenv').config();
const { testConnection, syncDatabase, sequelize } = require('../config/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  RESET DE LA BASE DE DONNÉES');
  console.log('='.repeat(70) + '\n');
  console.log('⚠️  ATTENTION: Cette action supprimera TOUTES les données!\n');

  try {
    const answer = await question('Êtes-vous sûr de vouloir continuer? (tapez "OUI" pour confirmer): ');

    if (answer.toUpperCase() !== 'OUI') {
      console.log('\n❌ Reset annulé\n');
      rl.close();
      return;
    }

    console.log('\n🔄 Reset en cours...\n');

    await testConnection();
    await syncDatabase(true); // force = true

    console.log('\n✅ Base de données réinitialisée avec succès');
    console.log('💡 Vous pouvez maintenant importer vos données: npm run db:import\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('');
  } finally {
    await sequelize.close();
    rl.close();
  }
}

resetDatabase();

