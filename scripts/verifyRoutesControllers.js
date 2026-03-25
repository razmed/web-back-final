// scripts/verifyRoutesControllers.js
require('dotenv').config();

const routeControllerMap = {
  'routes/appelsOffres.js': {
    controller: 'controllers/appelOffreController.js',
    methods: ['getAllAppelsOffres', 'getAppelOffreById', 'createAppelOffre', 'updateAppelOffre', 'deleteAppelOffre', 'downloadPdf', 'getStatistics']
  },
  'routes/projets.js': {
    controller: 'controllers/projetController.js',
    methods: ['getAllProjets', 'getProjetById', 'createProjet', 'updateProjet', 'deleteProjet', 'downloadImage', 'getStatistics']
  }
};

console.log('🔍 Vérification des correspondances routes/controllers\n');

let hasErrors = false;

Object.entries(routeControllerMap).forEach(([routeFile, config]) => {
  console.log(`\n📄 ${routeFile}`);
  console.log('-----------------------------------');
  
  try {
    const controller = require(`../${config.controller}`);
    const controllerMethods = Object.keys(controller);
    
    config.methods.forEach(method => {
      if (controllerMethods.includes(method)) {
        console.log(`✅ ${method}`);
      } else {
        console.error(`❌ ${method} - MANQUANT dans le controller`);
        console.log(`   Méthodes disponibles: ${controllerMethods.join(', ')}`);
        hasErrors = true;
      }
    });
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    hasErrors = true;
  }
});

console.log('\n=====================================');
if (hasErrors) {
  console.log('❌ Des erreurs de correspondance détectées');
  process.exit(1);
} else {
  console.log('✅ Toutes les méthodes correspondent');
  process.exit(0);
}

