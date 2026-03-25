// scripts/checkControllers.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des controllers\n');
console.log('=====================================\n');

const routesDir = path.join(__dirname, '../routes');
const controllersDir = path.join(__dirname, '../controllers');

// Routes à vérifier
const routesToCheck = {
  'appelsOffres.js': 'appelOffreController.js',
  'articles.js': 'articleController.js',
  'mentionMedias.js': 'mentionMediaController.js',
  'projets.js': 'projetController.js'
};

let hasErrors = false;

Object.entries(routesToCheck).forEach(([routeFile, controllerFile]) => {
  console.log(`\n📄 ${routeFile} → ${controllerFile}`);
  console.log('-----------------------------------');
  
  const controllerPath = path.join(controllersDir, controllerFile);
  
  if (!fs.existsSync(controllerPath)) {
    console.error(`❌ Controller manquant: ${controllerFile}`);
    hasErrors = true;
  } else {
    try {
      const controller = require(controllerPath);
      const methods = Object.keys(controller);
      
      if (methods.length === 0) {
        console.error(`❌ Controller vide: ${controllerFile}`);
        hasErrors = true;
      } else {
        console.log(`✅ Controller trouvé avec ${methods.length} méthode(s):`);
        methods.forEach(method => {
          console.log(`   - ${method}: ${typeof controller[method]}`);
        });
      }
    } catch (error) {
      console.error(`❌ Erreur lors du chargement: ${error.message}`);
      hasErrors = true;
    }
  }
});

console.log('\n=====================================');
if (hasErrors) {
  console.log('❌ Des controllers sont manquants ou invalides');
  process.exit(1);
} else {
  console.log('✅ Tous les controllers sont valides');
  process.exit(0);
}

