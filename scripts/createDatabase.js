require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
  console.log('\n' + '='.repeat(70));
  console.log('CRÉATION DE LA BASE DE DONNÉES');
  console.log('='.repeat(70) + '\n');

  try {
    // Connexion sans spécifier de base de données
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Connecté à MySQL');

    // Créer la base de données si elle n'existe pas
    const dbName = process.env.DB_NAME || 'sntp_db';
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`
    );

    console.log(`✅ Base de données "${dbName}" créée ou déjà existante`);

    // Créer également la base de test
    const dbNameTest = process.env.DB_NAME_TEST || 'sntp_db_test';
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbNameTest}\` 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`
    );

    console.log(`✅ Base de données de test "${dbNameTest}" créée ou déjà existante`);

    await connection.end();
    console.log('\n✅ Base de données prête à l\'emploi\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Vérifiez:');
    console.log('   1. MySQL est lancé');
    console.log('   2. Les credentials dans .env sont corrects');
    console.log('   3. L\'utilisateur a les droits de création de base de données\n');
    process.exit(1);
  }
}

createDatabase();

