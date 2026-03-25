// config/multerImages.js
const multer = require('multer');
const path = require('path');

// Configuration du stockage en mémoire pour l'upload d'images
const storage = multer.memoryStorage();

// Filtre pour accepter uniquement les images
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers images sont autorisés (JPEG, PNG, GIF, WebP, SVG)'), false);
  }
};

// Configuration de multer
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

module.exports = uploadImage;

