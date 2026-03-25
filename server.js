// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importer la configuration de la base de données
const { testConnection, syncDatabase } = require('./config/db');

// Importer les routes
const authRoutes = require('./routes/auth');
const appelsOffresRoutes = require('./routes/appelsOffres');
const projetsRoutes = require('./routes/projets');
const candidatureRoutes = require('./routes/candidature');
const articlesRoutes = require('./routes/articles');
const mfaRoutes = require('./routes/mfa');
const imageRoutes = require('./routes/images');
const contactRoutes = require('./routes/contact');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appels-offres', appelsOffresRoutes);
app.use('/api/projets', projetsRoutes);
app.use('/api', candidatureRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/contact',contactRoutes);
app.use('/api/categories', categoryRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API SNTP fonctionne correctement',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.stack);
  
  // Erreur Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Le fichier est trop volumineux (max 5MB)'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Fonction pour initialiser le serveur
const initializeServer = async () => {
  try {
    // 1. Tester la connexion à la base de données
    console.log('Test de connexion à la base de données...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Impossible de se connecter à la base de données');
      console.log('Vérifiez votre fichier .env et que MySQL est lancé');
      process.exit(1);
    }

    // 2. Synchroniser les modèles avec la base de données
    console.log('Synchronisation des modèles...');
    await syncDatabase(false); // false = ne pas supprimer les données existantes

    // 3. Démarrer le serveur
    if (process.env.NODE_ENV !== 'test') {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📡 API URL: http://localhost:${PORT}/api`);
        console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
initializeServer();

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  const sequelize = require('./config/db');
  await sequelize.close();
  console.log('✅ Connexion à la base de données fermée');
  process.exit(0);
});

module.exports = app;
