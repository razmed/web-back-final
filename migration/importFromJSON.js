require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { testConnection, syncDatabase } = require('../config/db');
const AppelOffre = require('../models/AppelOffre');

const jsonFilePath = path.join(__dirname, '..', 'data', 'appels-offres.json');

console.log('\n' + '='.repeat(80));
console.log('MIGRATION DES DONNÉES JSON VERS LA BASE DE DONNÉES');
console.log('='.repeat(80) + '\n');

async function importFromJSON() {
  try {
    // 1. Tester la connexion
    console.log('📡 Connexion à la base de données...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Impossible de se connecter à la base de données');
      return;
    }

    // 2. Synchroniser la base de données
    console.log('🔄 Synchronisation des modèles...');
    await syncDatabase(false);

    // 3. Vérifier si le fichier JSON existe
    if (!fs.existsSync(jsonFilePath)) {
      console.error('❌ Fichier JSON non trouvé:', jsonFilePath);
      return;
    }

    // 4. Lire les données JSON
    console.log('📖 Lecture du fichier JSON...');
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`   Trouvé: ${jsonData.length} appels d'offres\n`);

    // 5. Importer chaque appel d'offre
    console.log('💾 Import des données...\n');
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of jsonData) {
      try {
        // Vérifier si la référence existe déjà
        const exists = await AppelOffre.findOne({
          where: { reference: item.reference }
        });

        if (exists) {
          console.log(`⏭️  Ignoré (existe déjà): ${item.reference} - ${item.titre}`);
          skipped++;
          continue;
        }

        // Préparer les données
        const data = {
          titre: item.titre,
          description: item.description,
          datePublication: new Date(item.datePublication),
          dateEcheance: new Date(item.dateEcheance),
          reference: item.reference,
          montant: item.montant || null,
          localisation: item.localisation,
          statut: item.statut || 'actif',
          pdfPath: item.pdfPath || null,
          pdfOriginalName: item.pdfOriginalName || null
        };

        // Créer l'enregistrement
        await AppelOffre.create(data);
        console.log(`✅ Importé: ${item.reference} - ${item.titre}`);
        imported++;

      } catch (error) {
        console.error(`❌ Erreur pour ${item.reference}:`, error.message);
        errors++;
      }
    }

    // 6. Résumé
    console.log('\n' + '='.repeat(80));
    console.log('RÉSUMÉ DE L\'IMPORT');
    console.log('='.repeat(80));
    console.log(`✅ Importés: ${imported}`);
    console.log(`⏭️  Ignorés (déjà existants): ${skipped}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📊 Total traité: ${imported + skipped + errors}/${jsonData.length}`);
    console.log('='.repeat(80) + '\n');

    // 7. Vérification finale
    const totalInDB = await AppelOffre.count();
    console.log(`📈 Total dans la base de données: ${totalInDB}\n`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
  } finally {
    // Fermer la connexion
    const { sequelize } = require('../config/db');
    await sequelize.close();
    console.log('✅ Connexion fermée\n');
  }
}

// Exécuter l'import
importFromJSON();

