const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  motDePasse: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'editeur'),
    defaultValue: 'admin'
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  service: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tentativesConnexion: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dateVerrouillage: {
    type: DataTypes.DATE,
    allowNull: true
  },
  derniereConnexion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'admins',
  timestamps: true,
  hooks: {
    beforeCreate: async (admin) => {
      // Ne hasher QUE si le mot de passe n'est PAS déjà un hash bcrypt
      if (admin.motDePasse && !admin.motDePasse.startsWith('$2b$') && !admin.motDePasse.startsWith('$2a$')) {
        admin.motDePasse = await bcrypt.hash(admin.motDePasse, 10);
      }
    },
    beforeUpdate: async (admin) => {
      // Ne hasher que si le mot de passe a changé ET n'est pas déjà hashé
      if (admin.changed('motDePasse') && !admin.motDePasse.startsWith('$2b$') && !admin.motDePasse.startsWith('$2a$')) {
        admin.motDePasse = await bcrypt.hash(admin.motDePasse, 10);
      }
    }
  }
});

// Méthode pour comparer le mot de passe
Admin.prototype.comparerMotDePasse = async function(motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse);
};

// Méthode pour incrémenter les tentatives
Admin.prototype.incrementerTentatives = async function() {
  this.tentativesConnexion += 1;
  if (this.tentativesConnexion >= 5) {
    this.dateVerrouillage = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  await this.save();
};

// Méthode pour réinitialiser les tentatives
Admin.prototype.reinitialiserTentatives = async function() {
  this.tentativesConnexion = 0;
  this.dateVerrouillage = null;
  await this.save();
};

module.exports = Admin;
