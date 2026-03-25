// generateAdminPassword.js
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin'; // Changez ceci
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash du mot de passe:', hash);
  console.log('Ajoutez cette valeur à ADMIN_PASSWORD_HASH dans .env');
}

generateHash();

