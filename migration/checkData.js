const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'appels-offres.json');

console.log('\n' + '='.repeat(80));
console.log('VÉRIFICATION DES DONNÉES');
console.log('='.repeat(80) + '\n');

if (!fs.existsSync(dataPath)) {
  console.log('❌ Fichier non trouvé:', dataPath);
  console.log('\n💡 Créez le fichier en exécutant: npm run migrate\n');
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  console.log(`📊 Total: ${data.length} appels d'offres\n`);
  
  // Vérifier chaque appel d'offre
  data.forEach((ao, index) => {
    console.log(`${index + 1}. ${ao.titre || 'Sans titre'}`);
    console.log(`   ID: ${ao.id}`);
    console.log(`   Référence: ${ao.reference || '❌ MANQUANT'}`);
    console.log(`   Localisation: ${ao.localisation || '❌ MANQUANT'}`);
    console.log(`   Date publication: ${ao.datePublication ? '✅' : '❌ MANQUANT'}`);
    console.log(`   Date échéance: ${ao.dateEcheance ? '✅' : '❌ MANQUANT'}`);
    console.log(`   Montant: ${ao.montant ? '✅' : '⚠️  Non spécifié'}`);
    console.log(`   PDF: ${ao.pdfPath ? '✅' : '⚠️  Non spécifié'}`);
    console.log('');
  });
  
  // Statistiques
  const stats = {
    withPdf: data.filter(ao => ao.pdfPath).length,
    withMontant: data.filter(ao => ao.montant).length,
    actifs: data.filter(ao => ao.statut === 'actif').length,
    expires: data.filter(ao => ao.statut === 'expire').length
  };
  
  console.log('='.repeat(80));
  console.log('STATISTIQUES');
  console.log('='.repeat(80));
  console.log(`Avec PDF: ${stats.withPdf}/${data.length}`);
  console.log(`Avec montant: ${stats.withMontant}/${data.length}`);
  console.log(`Actifs: ${stats.actifs}`);
  console.log(`Expirés: ${stats.expires}`);
  console.log('\n✅ Vérification terminée\n');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

