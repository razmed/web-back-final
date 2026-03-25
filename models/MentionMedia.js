// models/MentionMedia.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MentionMedia = sequelize.define('MentionMedia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'titre',
    validate: {
      notEmpty: { msg: 'Le titre est requis' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'description'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'url',
    validate: {
      notEmpty: { msg: 'L\'URL est requise' },
      isUrl: { msg: 'URL invalide' }
    }
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'source'
  },
  logoSource: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'logo_source'
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_publication'
  },
  type: {
    type: DataTypes.ENUM('article', 'video', 'podcast', 'interview', 'communique'),
    defaultValue: 'article',
    allowNull: false,
    field: 'type'
  },
  statut: {
    type: DataTypes.ENUM('actif', 'archive'),
    defaultValue: 'actif',
    allowNull: false,
    field: 'statut'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'featured'
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'ordre'
  }
}, {
  tableName: 'mentions_medias',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

// Méthode pour formater la réponse JSON
MentionMedia.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  if (values.date_publication) {
    values.datePublication = values.date_publication;
    delete values.date_publication;
  }
  if (values.logo_source) {
    values.logoSource = values.logo_source;
    delete values.logo_source;
  }
  if (values.createdat) {
    values.createdAt = values.createdat;
    delete values.createdat;
  }
  if (values.updatedat) {
    values.updatedAt = values.updatedat;
    delete values.updatedat;
  }

  return values;
};

module.exports = MentionMedia;

