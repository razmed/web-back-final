const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MFASession = sequelize.define('MFASession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  currentStep: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    }
  },
  numbers: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('numbers');
      try {
        return rawValue ? JSON.parse(rawValue) : [];
      } catch (e) {
        console.error(' Erreur parsing numbers:', e);
        return [];
      }
    },
    set(value) {
      this.setDataValue('numbers', JSON.stringify(value));
    }
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lockExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'mfa_sessions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['sessionId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Méthode pour vérifier si la session est expirée
MFASession.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Méthode pour vérifier si l'étape actuelle est expirée
MFASession.prototype.isStepExpired = function() {
  try {
    // Utiliser le getter pour obtenir le tableau parsé
    const numbersArray = this.numbers;
    
    console.log(' isStepExpired - Type de numbers:', typeof numbersArray);
    console.log(' isStepExpired - Is Array:', Array.isArray(numbersArray));
    console.log(' isStepExpired - Length:', numbersArray.length);
    
    if (!Array.isArray(numbersArray) || numbersArray.length === 0) {
      console.log(' Numbers n\'est pas un tableau ou est vide');
      return false;
    }

    const currentStepData = numbersArray.find(n => n.step === this.currentStep);
    
    if (!currentStepData) {
      console.log(' Pas de données pour l\'étape', this.currentStep);
      return false;
    }

    if (!currentStepData.startTime) {
      console.log(' Pas de startTime pour l\'étape', this.currentStep);
      return false;
    }

    const stepTimeout = parseInt(process.env.MFA_TIMEOUT) || 120000; // 2 minutes par défaut
    const elapsed = new Date() - new Date(currentStepData.startTime);
    const isExpired = elapsed > stepTimeout;
    
    console.log(' Temps écoulé:', elapsed, 'ms / Timeout:', stepTimeout, 'ms / Expiré:', isExpired);
    
    return isExpired;
  } catch (error) {
    console.error(' Erreur dans isStepExpired:', error);
    return false;
  }
};

module.exports = MFASession;
