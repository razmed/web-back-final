const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const oldDataPath = path.join(__dirname, '..', 'data', 'appels-offres-old.json');
const newDataPath = path.join(__dirname, '..', 'data', 'appels-offres.json');
const backupPath = path.join(__dirname, '..', 'data', 'appels-offres-backup.json');

console.log('\n' + '='.repeat(80));
console.log('MIGRATION DES ANCIENNES DONNÉES - APPELS D\'OFFRES');
console.log('='.repeat(80) + '\n');

// Fonction pour convertir les anciennes données vers le nouveau format
function convertOldToNewFormat(oldData) {
  return oldData.map((item, index) => {
    // Générer un ID unique basé sur le timestamp
    const id = item.id || Date.now() + index;
    
    // Convertir les dates
    const datePublication = item.date_publication || item.datePublication || item.date || new Date().toISOString();
    const dateEcheance = item.date_echeance || item.dateEcheance || item.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // S'assurer que les dates sont au format ISO
    const parseDate = (dateStr) => {
      if (!dateStr) return new Date().toISOString();
      
      try {
        // Si c'est déjà un timestamp
        if (typeof dateStr === 'number') {
          return new Date(dateStr).toISOString();
        }
        
        // Si c'est une string ISO
        if (dateStr.includes('T')) {
          return new Date(dateStr).toISOString();
        }
        
        // Si c'est au format DD/MM/YYYY
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          return new Date(`${year}-${month}-${day}`).toISOString();
        }
        
        // Si c'est au format YYYY-MM-DD
        if (dateStr.includes('-')) {
          return new Date(dateStr).toISOString();
        }
        
        // Fallback
        return new Date(dateStr).toISOString();
      } catch (error) {
        console.warn(`⚠️  Date invalide pour l'item ${item.titre || 'sans titre'}: ${dateStr}`);
        return new Date().toISOString();
      }
    };
    
    const newItem = {
      id: id.toString(),
      titre: item.titre || item.title || item.name || 'Appel d\'offre sans titre',
      description: item.description || item.desc || item.details || '',
      datePublication: parseDate(datePublication),
      dateEcheance: parseDate(dateEcheance),
      reference: item.reference || item.ref || item.numero || `AO-${id}`,
      montant: item.montant || item.budget || item.price || null,
      localisation: item.localisation || item.location || item.lieu || 'Non spécifié',
      statut: item.statut || item.status || 'actif',
      pdfPath: item.pdfPath || item.pdf || item.fichier || null,
      pdfOriginalName: item.pdfOriginalName || item.pdfName || null,
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`✓ Converti: ${newItem.titre} (${newItem.reference})`);
    
    return newItem;
  });
}

// Fonction principale de migration
async function migrate() {
  try {
    // 1. Vérifier si les anciennes données existent
    if (!fs.existsSync(oldDataPath)) {
      console.log('❌ Fichier des anciennes données non trouvé:', oldDataPath);
      console.log('   Créez le fichier: data/appels-offres-old.json\n');
      
      // Créer un fichier exemple
      const exampleOldData = [
        {
          id: 1,
          titre: "Construction d'un pont",
          description: "Construction d'un pont de 500m",
          date_publication: "2024-01-15",
          date_echeance: "2024-03-15",
          reference: "AO-2024-001",
          montant: 50000000,
          localisation: "Alger",
          statut: "actif"
        }
      ];
      
      fs.writeFileSync(oldDataPath, JSON.stringify(exampleOldData, null, 2));
      console.log('✓ Fichier exemple créé:', oldDataPath);
      console.log('   Remplacez-le par vos vraies données\n');
      return;
    }
    
    // 2. Lire les anciennes données
    console.log('📖 Lecture des anciennes données...');
    const oldDataContent = fs.readFileSync(oldDataPath, 'utf8');
    const oldData = JSON.parse(oldDataContent);
    console.log(`   Trouvé: ${oldData.length} appels d'offres\n`);
    
    // 3. Sauvegarder les données actuelles (si elles existent)
    if (fs.existsSync(newDataPath)) {
      console.log('💾 Sauvegarde des données actuelles...');
      const currentData = fs.readFileSync(newDataPath, 'utf8');
      fs.writeFileSync(backupPath, currentData);
      console.log(`   Backup créé: ${backupPath}\n`);
    }
    
    // 4. Convertir les données
    console.log('🔄 Conversion des données...\n');
    const newData = convertOldToNewFormat(oldData);
    
    // 5. Fusionner avec les données existantes (si elles existent)
    let finalData = newData;
    if (fs.existsSync(newDataPath)) {
      const existingData = JSON.parse(fs.readFileSync(newDataPath, 'utf8'));
      
      // Éviter les doublons basés sur la référence
      const existingRefs = new Set(existingData.map(item => item.reference));
      const newItems = newData.filter(item => !existingRefs.has(item.reference));
      
      finalData = [...existingData, ...newItems];
      console.log(`\n📊 ${existingData.length} existants + ${newItems.length} nouveaux = ${finalData.length} total`);
    }
    
    // 6. Sauvegarder les nouvelles données
    console.log('\n💾 Sauvegarde des nouvelles données...');
    fs.writeFileSync(newDataPath, JSON.stringify(finalData, null, 2), 'utf8');
    console.log(`   Sauvegardé: ${newDataPath}`);
    
    // 7. Résumé
    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION TERMINÉE AVEC SUCCÈS');
    console.log('='.repeat(80));
    console.log(`\n📈 Statistiques:`);
    console.log(`   - Total d'appels d'offres: ${finalData.length}`);
    console.log(`   - Fichier de sortie: ${newDataPath}`);
    console.log(`   - Backup: ${backupPath}`);
    console.log('\n🚀 Vous pouvez maintenant démarrer le serveur: npm start\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR LORS DE LA MIGRATION:');
    console.error(error);
    console.log('\n💡 Vérifiez que le fichier JSON est valide\n');
  }
}

// Exécuter la migration
migrate();

