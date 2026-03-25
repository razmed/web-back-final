// routes/projets.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const projetController = require('../controllers/projetController');
const uploadImage = require('../config/multerImages'); // Import du nouveau multer

// GET - Obtenir tous les projets (public)
router.get('/', projetController.getAllProjets);

// GET - Obtenir un projet par ID (public)
router.get('/:id', projetController.getProjetById);

// GET - Télécharger l'image d'un projet (public)
router.get('/:id/image', projetController.downloadImage);

// POST - Créer un nouveau projet (protégé)
router.post(
  '/',
  authenticateToken,
  uploadImage.single('image'), // Multer pour gérer l'upload d'image
  [
    body('titre').trim().notEmpty().withMessage('Le titre est requis'),
    body('category').isIn(['routes', 'batiments', 'ouvrages', 'hydraulique', 'industriel']).withMessage('Catégorie invalide'),
    body('location').trim().notEmpty().withMessage('La localisation est requise'),
    body('year').trim().notEmpty().withMessage('L\'année est requise'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('status').optional().isIn(['completed', 'inprogress']).withMessage('Statut invalide'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide')
  ],
  projetController.createProjet
);

// PUT - Mettre à jour un projet (protégé)
router.put(
  '/:id',
  authenticateToken,
  uploadImage.single('image'), // Multer pour gérer l'upload d'image
  [
    body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
    body('category').optional().isIn(['routes', 'batiments', 'ouvrages', 'hydraulique', 'industriel']).withMessage('Catégorie invalide'),
    body('location').optional().trim().notEmpty().withMessage('La localisation ne peut pas être vide'),
    body('year').optional().trim().notEmpty().withMessage('L\'année ne peut pas être vide'),
    body('description').optional().trim().notEmpty().withMessage('La description ne peut pas être vide'),
    body('status').optional().isIn(['completed', 'inprogress']).withMessage('Statut invalide'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude invalide'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude invalide')
  ],
  projetController.updateProjet
);

// DELETE - Supprimer un projet (protégé)
router.delete('/:id', authenticateToken, projetController.deleteProjet);

// GET - Obtenir les statistiques (protégé)
router.get('/admin/statistics', authenticateToken, projetController.getStatistics);

module.exports = router;
