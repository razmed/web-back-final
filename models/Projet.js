// models/Projet.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // CORRECTION ICI : destructurer sequelize

const Projet = sequelize.define('Projet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le titre est requis' },
      len: {
        args: [3, 255],
        msg: 'Le titre doit contenir entre 3 et 255 caractères'
      }
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  // Ancien champ - conservé pour compatibilité temporaire
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image',
    comment: 'Ancien chemin - déprécié'
  },
  // NOUVEAUX CHAMPS POUR STOCKER L'IMAGE EN BASE DE DONNÉES
  imageData: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    field: 'imagedata',
    comment: 'Contenu binaire de l\'image du projet'
  },
  imageOriginalName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'imageoriginalname',
    comment: 'Nom original du fichier image'
  },
  imageMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'imagemimetype',
    defaultValue: 'image/jpeg',
    comment: 'Type MIME de l\'image'
  },
  imageSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'imagesize',
    comment: 'Taille de l\'image en octets'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La localisation est requise' }
    }
  },
  year: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'L\'année est requise' }
    }
  },
  status: {
    type: DataTypes.ENUM('completed', 'inprogress'),
    defaultValue: 'inprogress',
    allowNull: false,
    validate: {
      isIn: {
        args: [['completed', 'inprogress']],
        msg: 'Statut invalide'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La description est requise' }
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      isDecimal: { msg: 'La latitude doit être un nombre décimal valide' },
      min: { args: [-90], msg: 'La latitude doit être entre -90 et 90' },
      max: { args: [90], msg: 'La latitude doit être entre -90 et 90' }
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      isDecimal: { msg: 'La longitude doit être un nombre décimal valide' },
      min: { args: [-180], msg: 'La longitude doit être entre -180 et 180' },
      max: { args: [180], msg: 'La longitude doit être entre -180 et 180' }
    }
  }
}, {
  tableName: 'projets',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
  indexes: [
    { name: 'idx_category', fields: ['category_id'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_year', fields: ['year'] }
  ]
});

// Méthode d'instance pour formater la réponse JSON
Projet.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Formater les dates au format ISO
  if (values.createdat) {
    values.createdAt = new Date(values.createdat).toISOString();
    delete values.createdat;
  }
  if (values.updatedat) {
    values.updatedAt = new Date(values.updatedat).toISOString();
    delete values.updatedat;
  }
  
  // Gérer les champs image
  if (values.imagedata) {
    values.imageData = values.imagedata;
    delete values.imagedata;
  }
  if (values.imagesize) {
    values.imageSize = values.imagesize;
    delete values.imagesize;
  }
  if (values.imagemimetype) {
    values.imageMimeType = values.imagemimetype;
    delete values.imagemimetype;
  }
  if (values.imageoriginalname) {
    values.imageOriginalName = values.imageoriginalname;
    delete values.imageoriginalname;
  }
  
  // Ne pas exposer le contenu binaire de l'image dans le JSON
  if (values.imageData) {
    values.hasImage = true;
    delete values.imageData;
  } else {
    values.hasImage = false;
  }
  
  // Convertir les coordonnées en tableau pour le frontend
  if (values.latitude && values.longitude) {
    values.coordinates = [parseFloat(values.latitude), parseFloat(values.longitude)];
  }
  
  return values;
};

// Méthodes statiques
Projet.getStatistics = async function() {
  const total = await this.count();
  const completed = await this.count({ where: { status: 'completed' } });
  const inProgress = await this.count({ where: { status: 'inprogress' } });
  
  // Statistiques par catégorie
  const routes = await this.count({ where: { category: 'routes' } });
  const batiments = await this.count({ where: { category: 'batiments' } });
  const ouvrages = await this.count({ where: { category: 'ouvrages' } });
  const hydraulique = await this.count({ where: { category: 'hydraulique' } });
  const industriel = await this.count({ where: { category: 'industriel' } });
  
  return {
    total,
    completed,
    inProgress,
    byCategory: {
      routes,
      batiments,
      ouvrages,
      hydraulique,
      industriel
    }
  };
};

module.exports = Projet;