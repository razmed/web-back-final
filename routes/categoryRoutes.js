// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth'); // DESTRUCTURATION ICI

// Configuration Multer pour l'upload d'images en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.'));
    }
  }
});

// Routes publiques
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// ⚠️ IMPORTANT: Route image AVANT route :id
router.get('/:id/image', categoryController.getCategoryImage);
router.get('/:id', categoryController.getCategoryById);


// Routes protégées (admin)
router.post('/', authenticateToken, upload.single('photo'), categoryController.createCategory);
router.put('/:id', authenticateToken, upload.single('photo'), categoryController.updateCategory);
router.delete('/:id', authenticateToken, categoryController.deleteCategory);

module.exports = router;
