// models/Article.js - VERSION COMPLÈTE
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Article = sequelize.define('Article', {
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
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'slug'
  },
  extrait: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'extrait'
  },
  contenu: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    field: 'contenu'
  },
  // NOUVEAUX CHAMPS POUR MENTIONS MÉDIAS
  typeContenu: {
    type: DataTypes.ENUM('article', 'mention_media'),
    defaultValue: 'article',
    allowNull: false,
    field: 'type_contenu'
  },
  urlExterne: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'url_externe',
    validate: {
      isUrl: { 
        msg: 'URL invalide',
        allowNull: true
      }
    }
  },
  sourceMedia: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'source_media'
  },
  logoSource: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'logo_source'
  },
  typeMedia: {
    type: DataTypes.ENUM('article', 'video', 'podcast', 'interview', 'communique'),
    allowNull: true,
    field: 'type_media'
  },
  // FIN NOUVEAUX CHAMPS
  imagePrincipale: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_principale'
  },
  imageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'image_id',
    references: {
      model: 'images',
      key: 'id'
    }
  },
  auteur: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'auteur',
    defaultValue: 'SNTP'
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'date_publication'
  },
  statut: {
    type: DataTypes.ENUM('brouillon', 'publie', 'archive'),
    defaultValue: 'brouillon',
    allowNull: false,
    field: 'statut'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'tags',
    defaultValue: []
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'meta_description'
  },
  metaKeywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'meta_keywords'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'featured'
  },
  vues: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'vues'
  },
  ordre: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'ordre'
  }
}, {
  tableName: 'articles',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
  hooks: {
    beforeValidate: (article) => {
      // Validation spécifique selon le type de contenu
      if (article.typeContenu === 'mention_media') {
        // Pour une mention média, l'URL externe est obligatoire
        if (!article.urlExterne) {
          throw new Error('URL externe requise pour une mention média');
        }
        // Le contenu n'est pas obligatoire pour une mention média
        article.contenu = article.contenu || null;
      } else {
        // Pour un article classique, le contenu est obligatoire
        if (!article.contenu) {
          throw new Error('Le contenu est requis pour un article');
        }
      }
    }
  }
});

// Méthode pour formater la réponse JSON
Article.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Transformer les noms de colonnes snake_case en camelCase
  if (values.image_principale) {
    values.imagePrincipale = values.image_principale;
    delete values.image_principale;
  }
  if (values.date_publication) {
    values.datePublication = values.date_publication;
    delete values.date_publication;
  }
  if (values.meta_description) {
    values.metaDescription = values.meta_description;
    delete values.meta_description;
  }
  if (values.meta_keywords) {
    values.metaKeywords = values.meta_keywords;
    delete values.meta_keywords;
  }
  if (values.type_contenu) {
    values.typeContenu = values.type_contenu;
    delete values.type_contenu;
  }
  if (values.url_externe) {
    values.urlExterne = values.url_externe;
    delete values.url_externe;
  }
  if (values.source_media) {
    values.sourceMedia = values.source_media;
    delete values.source_media;
  }
  if (values.logo_source) {
    values.logoSource = values.logo_source;
    delete values.logo_source;
  }
  if (values.type_media) {
    values.typeMedia = values.type_media;
    delete values.type_media;
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

Article.prototype.getImageUrl = function() {
  if (this.imageId) {
    return `http://localhost:5000/api/images/${this.imageId}`;
  }
  return this.imagePrincipale || null;
}

module.exports = Article;

