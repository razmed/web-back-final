// scripts/fixAuthMiddleware.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de authMiddleware → authenticateToken\n');

const routesDir = path.join(__dirname, '../routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  
  // Correction 1 : Import
  const importPatterns = [
    {
      wrong: /const authMiddleware = require\(['"]\.\.\/middleware\/auth['"]\);?/g,
      correct: "const { authenticateToken } = require('../middleware/auth');"
    },
    {
      wrong: /const auth = require\(['"]\.\.\/middleware\/auth['"]\);?\s*const authMiddleware = auth\.authenticateToken;?/g,
      correct: "const { authenticateToken } = require('../middleware/auth');"
    }
  ];
  
  importPatterns.forEach(pattern => {
    if (pattern.wrong.test(content)) {
      content = content.replace(pattern.wrong, pattern.correct);
      modified = true;
    }
  });
  
  // Correction 2 : Utilisation
  const usagePattern = /\bauthMiddleware\b/g;
  if (usagePattern.test(content)) {
    content = content.replace(usagePattern, 'authenticateToken');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corrigé: ${file}`);
    totalFixed++;
  } else {
    console.log(`⏭️  Ignoré: ${file} (déjà correct)`);
  }
});

console.log(`\n✅ ${totalFixed} fichier(s) corrigé(s)`);

