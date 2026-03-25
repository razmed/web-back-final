// routes/images.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageController = require('../controllers/imageController');
const { authenticateToken } = require('../middleware/auth'); // ✅ Destructuration

// Configuration Multer pour stocker en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

// Routes publiques - Cette route doit être AVANT les routes protégées
router.get('/:id', imageController.getImageById);

// Routes protégées (admin)
router.post('/upload', authenticateToken, upload.single('image'), imageController.uploadImage);
router.get('/', authenticateToken, imageController.getAllImages);
router.delete('/:id', authenticateToken, imageController.deleteImage);

module.exports = router;

