// scripts/fixRoutesMethodNames.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des noms de méthodes dans les routes\n');

const fixes = [
  {
    file: 'routes/appelsOffres.js',
    controller: '../controllers/appelOffreController',
    replacements: [
      { from: 'createAppelOffres', to: 'createAppelOffre' },
      { from: 'updateAppelOffres', to: 'updateAppelOffre' },
      { from: 'deleteAppelOffres', to: 'deleteAppelOffre' },
      { from: 'getAppelOffresById', to: 'getAppelOffreById' }
    ]
  },
  {
    file: 'routes/projets.js',
    controller: '../controllers/projetController',
    replacements: [
      { from: 'createProjets', to: 'createProjet' },
      { from: 'updateProjets', to: 'updateProjet' },
      { from: 'deleteProjets', to: 'deleteProjet' }
    ]
  }
];

fixes.forEach(({ file, controller, replacements }) => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${file} - fichier introuvable`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Vérifier le require du controller
  const controllerRequirePattern = /const \w+ = require\(['"]([^'"]+)['"]\)/;
  const match = content.match(controllerRequirePattern);
  
  if (match && match[1] !== controller) {
    content = content.replace(match[1], controller);
    modified = true;
    console.log(`✅ ${file} - Controller import corrigé`);
  }

  // Appliquer les remplacements
  replacements.forEach(({ from, to }) => {
    const regex = new RegExp(`\\.${from}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `.${to}`);
      modified = true;
      console.log(`✅ ${file} - ${from} → ${to}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`💾 ${file} - Sauvegardé\n`);
  } else {
    console.log(`⏭️  ${file} - Aucune modification nécessaire\n`);
  }
});

console.log('✅ Correction terminée');

