const sequelize = require('../config/database');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    console.log('🔄 Création d\'un nouvel administrateur...\n');

    await sequelize.sync({ alter: false });

    // Définir les informations de l'admin
    const adminData = {
      nom: 'Admin',
      prenom: 'SNTP',
      email: 'it@sntp.dz',
      motDePasse: 'Admin@123', // ← MOT DE PASSE EN CLAIR (sera hashé automatiquement)
      role: 'super_admin',
      permissions: ['creer', 'modifier', 'supprimer', 'voir_stats', 'gerer_admins'],
      actif: true
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await Admin.findOne({ where: { email: adminData.email } });

    if (existingAdmin) {
      console.log('⚠️  Un admin avec cet email existe déjà.');
      console.log('\nVoulez-vous le mettre à jour ? Modifiez le script ou supprimez-le manuellement.\n');
      
      // Pour mettre à jour le mot de passe :
      existingAdmin.motDePasse = adminData.motDePasse;
      await existingAdmin.save();
      console.log('✓ Mot de passe mis à jour avec succès !');
    } else {
      // Créer le nouvel admin
      const admin = await Admin.create(adminData);
      console.log('✓ Admin créé avec succès !');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email    : it@sntp.dz');
    console.log('🔑 Mot de passe : Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();

