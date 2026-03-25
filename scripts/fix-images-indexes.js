// scripts/fix-images-indexes.js
require('dotenv').config();
const { sequelize } = require('../config/db');

async function fixImagesTable() {
  try {
    console.log('🔧 Correction de la table images...\n');

    // Supprimer tous les index sauf PRIMARY
    console.log('1. Suppression des index...');
    const [indexes] = await sequelize.query(`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'images' 
        AND INDEX_NAME != 'PRIMARY'
    `);

    for (const index of indexes) {
      try {
        await sequelize.query(`DROP INDEX \`${index.INDEX_NAME}\` ON images`);
        console.log(`   ✓ Index supprimé : ${index.INDEX_NAME}`);
      } catch (err) {
        console.log(`   ⚠ Impossible de supprimer : ${index.INDEX_NAME}`);
      }
    }

    // Recréer les index nécessaires
    console.log('\n2. Création des index essentiels...');
    
    try {
      await sequelize.query(`CREATE UNIQUE INDEX idx_filename ON images(filename)`);
      console.log('   ✓ Index créé : idx_filename');
    } catch (err) {
      console.log('   ⚠ Index idx_filename existe déjà');
    }

    try {
      await sequelize.query(`CREATE INDEX idx_created_at ON images(created_at)`);
      console.log('   ✓ Index créé : idx_created_at');
    } catch (err) {
      console.log('   ⚠ Index idx_created_at existe déjà');
    }

    // Vérification finale
    console.log('\n3. Vérification finale...');
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as total 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'images'
    `);

    console.log(`   ✓ Nombre total d'index : ${result[0].total}`);

    if (result[0].total > 10) {
      console.log('\n⚠️  ATTENTION : Encore trop d\'index. Considérez supprimer la table et la recréer.');
    } else {
      console.log('\n✅ Table images corrigée avec succès !');
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixImagesTable();

