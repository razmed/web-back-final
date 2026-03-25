require('dotenv').config();
const { sequelize } = require('../config/db');
const AppelOffre = require('../models/AppelOffre');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('MIGRATION DES PDF VERS LA BASE DE DONNÉES');
console.log('='.repeat(80));

async function migratePDFs() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✓ Connexion à la base de données réussie');

    // Synchroniser le modèle (ajouter les nouvelles colonnes)
    await sequelize.sync({ alter: true });
    console.log('✓ Structure de la table mise à jour');

    // Récupérer tous les appels d'offres ayant un pdfPath mais pas de pdfData
    const { Op } = require('sequelize');
    const appelsOffres = await AppelOffre.findAll({
      where: {
        pdfPath: {
          [Op.ne]: null
        },
        pdfData: null
      }
    });

    console.log(`\n${appelsOffres.length} appels d'offres à migrer`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const ao of appelsOffres) {
      try {
        const pdfPath = path.join(__dirname, '..', ao.pdfPath);

        // Vérifier si le fichier existe
        if (!fs.existsSync(pdfPath)) {
          console.error(`✗ Fichier non trouvé: ${ao.pdfPath} (ID: ${ao.id})`);
          errorCount++;
          continue;
        }

        // Lire le contenu du fichier
        const pdfBuffer = fs.readFileSync(pdfPath);

        // Mettre à jour l'enregistrement
        await ao.update({
          pdfData: pdfBuffer,
          pdfSize: pdfBuffer.length,
          pdfMimeType: 'application/pdf'
        });

        console.log(`✓ Migré: ${ao.reference} - ${ao.pdfOriginalName} (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
        migratedCount++;

        // Optionnel: Supprimer le fichier physique après migration
        // fs.unlinkSync(pdfPath);
      } catch (error) {
        console.error(`✗ Erreur pour l'AO ${ao.reference}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(80));
    console.log(`✓ Migrés: ${migratedCount}`);
    console.log(`✗ Erreurs: ${errorCount}`);
    console.log(`Total: ${appelsOffres.length}`);
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    await sequelize.close();
    console.log('\n✓ Connexion fermée');
  }
}

// Exécuter la migration
migratePDFs();

