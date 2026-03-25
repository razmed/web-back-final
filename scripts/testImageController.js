// scripts/testImageController.js
const imageController = require('../controllers/imageController');

console.log('🔍 Diagnostic du controller images:\n');

console.log('uploadImage:', typeof imageController.uploadImage);
console.log('getImageById:', typeof imageController.getImageById);
console.log('getAllImages:', typeof imageController.getAllImages);
console.log('deleteImage:', typeof imageController.deleteImage);

console.log('\n✅ Toutes les fonctions doivent être "function"');

if (
  typeof imageController.uploadImage !== 'function' ||
  typeof imageController.getImageById !== 'function' ||
  typeof imageController.getAllImages !== 'function' ||
  typeof imageController.deleteImage !== 'function'
) {
  console.error('\n❌ ERREUR: Une ou plusieurs fonctions ne sont pas définies correctement!');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les fonctions sont correctement définies!');
  process.exit(0);
}

