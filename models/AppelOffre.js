const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AppelOffre = sequelize.define('AppelOffre', {
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
      notEmpty: {
        msg: 'Le titre est requis'
      },
      len: {
        args: [3, 255],
        msg: 'Le titre doit contenir entre 3 et 255 caractères'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La description est requise'
      }
    }
  },
  datePublication: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_publication',
    validate: {
      isDate: {
        msg: 'Date de publication invalide'
      }
    }
  },
  dateEcheance: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'date_echeance',
    validate: {
      isDate: {
        msg: "Date d'échéance invalide"
      },
      isAfterPublication(value) {
        if (this.datePublication && new Date(value) <= new Date(this.datePublication)) {
          throw new Error("La date d'échéance doit être après la date de publication");
        }
      }
    }
  },
  reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Cette référence existe déjà'
    },
    validate: {
      notEmpty: {
        msg: 'La référence est requise'
      }
    }
  },
  montant: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: null,
    validate: {
      isDecimal: {
        msg: 'Le montant doit être un nombre décimal valide'
      },
      min: {
        args: [0],
        msg: 'Le montant doit être positif'
      }
    }
  },
  localisation: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La localisation est requise'
      }
    }
  },
  statut: {
    type: DataTypes.ENUM('actif', 'expire', 'annule'),
    defaultValue: 'actif',
    allowNull: false,
    validate: {
      isIn: {
        args: [['actif', 'expire', 'annule']],
        msg: 'Statut invalide'
      }
    }
  },
  // Nouvelles colonnes pour stocker le PDF dans la BDD
  pdfData: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    field: 'pdf_data',
    comment: 'Contenu binaire du fichier PDF'
  },
  pdfSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'pdf_size',
    comment: 'Taille du fichier en octets'
  },
  pdfMimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'pdf_mime_type',
    defaultValue: 'application/pdf',
    comment: 'Type MIME du fichier'
  },
  pdfOriginalName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'pdf_original_name',
    comment: 'Nom original du fichier'
  },
  // Ancienne colonne (conservée pour compatibilité temporaire)
  pdfPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'pdf_path',
    comment: 'Ancien chemin - déprécié'
  }
}, {
  tableName: 'appels_offres',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_reference',
      unique: true,
      fields: ['reference']
    },
    {
      name: 'idx_statut',
      fields: ['statut']
    },
    {
      name: 'idx_date_echeance',
      fields: ['date_echeance']
    },
    {
      name: 'idx_localisation',
      fields: ['localisation']
    }
  ]
});

// Méthode d'instance pour formater la réponse JSON
AppelOffre.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Formater les dates au format ISO
  if (values.datePublication) {
    values.datePublication = new Date(values.datePublication).toISOString();
  }
  if (values.dateEcheance) {
    values.dateEcheance = new Date(values.dateEcheance).toISOString();
  }
  if (values.created_at) {
    values.createdAt = new Date(values.created_at).toISOString();
    delete values.created_at;
  }
  if (values.updated_at) {
    values.updatedAt = new Date(values.updated_at).toISOString();
    delete values.updated_at;
  }

  // Renommer les champs pour camelCase
  if (values.date_publication) {
    values.datePublication = new Date(values.date_publication).toISOString();
    delete values.date_publication;
  }
  if (values.date_echeance) {
    values.dateEcheance = new Date(values.date_echeance).toISOString();
    delete values.date_echeance;
  }
  
  // Gérer les champs PDF
  if (values.pdf_data) {
    values.pdfData = values.pdf_data;
    delete values.pdf_data;
  }
  if (values.pdf_size) {
    values.pdfSize = values.pdf_size;
    delete values.pdf_size;
  }
  if (values.pdf_mime_type) {
    values.pdfMimeType = values.pdf_mime_type;
    delete values.pdf_mime_type;
  }
  if (values.pdf_original_name) {
    values.pdfOriginalName = values.pdf_original_name;
    delete values.pdf_original_name;
  }
  if (values.pdf_path) {
    values.pdfPath = values.pdf_path;
    delete values.pdf_path;
  }

  // Ne pas exposer le contenu binaire du PDF dans le JSON
  if (values.pdfData) {
    values.hasPdf = true;
    delete values.pdfData;
  } else {
    values.hasPdf = false;
  }

  return values;
};

// Méthodes statiques
AppelOffre.getStatistics = async function() {
  const total = await this.count();
  const actifs = await this.count({ where: { statut: 'actif' } });
  const expires = await this.count({ where: { statut: 'expire' } });
  const annules = await this.count({ where: { statut: 'annule' } });

  return { total, actifs, expires, annules };
};

module.exports = AppelOffre;

