const sequelize = require('../config/database');
const Admin = require('../models/Admin');
const MFASession = require('../models/MFASession');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('🔄 Initialisation de la base de données...\n');

    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ alter: true });
    console.log('✓ Tables créées/mises à jour avec succès\n');

    // Vérifier si l'admin par défaut existe
    const adminEmail = process.env.ADMIN_EMAIL || 'it@sntp.dz';
    const adminExists = await Admin.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      // Créer l'admin par défaut
      await Admin.create({
        nom: 'Admin',
        prenom: 'SNTP',
        email: adminEmail,
        motDePasse: process.env.ADMIN_PASSWORD_HASH, // Hash déjà créé
        role: 'super_admin',
        permissions: ['creer', 'modifier', 'supprimer', 'voir_stats', 'gerer_admins'],
        actif: true
      });
      console.log(`✓ Admin par défaut créé: ${adminEmail}\n`);
    } else {
      console.log(`✓ Admin existe déjà: ${adminEmail}\n`);
    }

    console.log('✅ Initialisation terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
};

initDatabase();

