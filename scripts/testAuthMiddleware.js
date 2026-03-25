// scripts/testAuthMiddleware.js
require('dotenv').config();

console.log('🔍 Diagnostic du middleware auth:\n');

try {
  const auth = require('../middleware/auth');
  
  console.log('Module auth:', auth);
  console.log('authenticateToken:', typeof auth.authenticateToken);
  
  if (typeof auth.authenticateToken !== 'function') {
    console.error('\n❌ ERREUR: authenticateToken n\'est pas une fonction!');
    console.log('Contenu du module:', Object.keys(auth));
    process.exit(1);
  }
  
  console.log('\n✅ Le middleware authenticateToken est correctement défini!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ ERREUR lors du chargement du middleware:', error.message);
  process.exit(1);
}

