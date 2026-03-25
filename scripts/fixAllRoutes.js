// scripts/fixAllRoutes.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des routes\n');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Patterns à corriger
  const fixes = [
    {
      wrong: /const authenticateToken = require\('\.\.\/middleware\/auth'\);?/g,
      correct: "const { authenticateToken } = require('../middleware/auth');"
    },
    {
      wrong: /const auth = require\('\.\.\/middleware\/auth'\);?\nconst authenticateToken = auth\.authenticateToken;?/g,
      correct: "const { authenticateToken } = require('../middleware/auth');"
    }
  ];
  
  let modified = false;
  fixes.forEach(fix => {
    if (fix.wrong.test(content)) {
      content = content.replace(fix.wrong, fix.correct);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${file}`);
  } else {
    console.log(`⏭️  Ignoré: ${file} (déjà correct)`);
  }
});

console.log('\n✅ Correction terminée');

