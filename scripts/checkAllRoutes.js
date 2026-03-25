// scripts/checkAllRoutes.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de toutes les routes\n');
console.log('=====================================\n');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let hasErrors = false;

files.forEach(file => {
  console.log(`\n📄 Vérification: ${file}`);
  console.log('-----------------------------------');
  
  try {
    const routePath = path.join(routesDir, file);
    delete require.cache[require.resolve(routePath)]; // Clear cache
    const route = require(routePath);
    
    if (typeof route === 'function' || (route && typeof route.use === 'function')) {
      console.log(`✅ ${file} - OK`);
    } else {
      console.log(`⚠️  ${file} - Structure inhabituelle`);
    }
  } catch (error) {
    console.error(`❌ ${file} - ERREUR:`);
    console.error(`   ${error.message}`);
    if (error.stack) {
      const relevantStack = error.stack.split('\n').slice(0, 5).join('\n');
      console.error(relevantStack);
    }
    hasErrors = true;
  }
});

console.log('\n=====================================');
if (hasErrors) {
  console.log('❌ Des erreurs ont été détectées');
  process.exit(1);
} else {
  console.log('✅ Toutes les routes sont valides');
  process.exit(0);
}

