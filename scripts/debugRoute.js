// scripts/debugRoute.js
const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '../routes/appelsOffres.js');
const content = fs.readFileSync(routePath, 'utf8');
const lines = content.split('\n');

console.log('🔍 Contenu de routes/appelsOffres.js autour de la ligne 18:\n');
console.log('=====================================\n');

// Afficher les lignes 10-25
for (let i = 10; i < 25 && i < lines.length; i++) {
  const lineNum = i + 1;
  const prefix = lineNum === 18 ? '>>> ' : '    ';
  console.log(`${prefix}${lineNum}: ${lines[i]}`);
}

console.log('\n=====================================\n');

// Analyser les imports
console.log('📦 Imports détectés:\n');
const importLines = lines.filter(line => line.includes('require('));
importLines.forEach((line, idx) => {
  console.log(`${idx + 1}. ${line.trim()}`);
});

