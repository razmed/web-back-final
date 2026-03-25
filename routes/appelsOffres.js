// routes/appelsOffres.js - CORRECTION COMPLÈTE
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth'); // ✅ CORRECTION ICI
const upload = require('../config/multer');
const appelOffreController = require('../controllers/appelOffreController');

// GET - Obtenir tous les appels d'offres (public)
router.get('/', appelOffreController.getAllAppelsOffres);

// GET - Obtenir un appel d'offre par ID (public)
router.get('/:id', appelOffreController.getAppelOffreById);

// GET - Télécharger le PDF d'un appel d'offre (public)
router.get('/:id/pdf', appelOffreController.downloadPdf);

// POST - Créer un nouvel appel d'offre (protégé)
router.post(
  '/',
  authenticateToken, // ✅ CORRECTION ICI
  upload.single('pdf'),
  [
    body('titre').trim().notEmpty().withMessage('Le titre est requis'),
    body('description').trim().notEmpty().withMessage('La description est requise'),
    body('datePublication').isISO8601().withMessage('Date de publication invalide'),
    body('dateEcheance').isISO8601().withMessage('Date limite invalide'),
    body('statut').isIn(['actif', 'cloture', 'annule']).withMessage('Statut invalide')
  ],
  appelOffreController.createAppelOffre
);

// PUT - Mettre à jour un appel d'offre (protégé)
router.put(
  '/:id',
  authenticateToken, // ✅ CORRECTION ICI
  upload.single('pdf'),
  [
    body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
    body('description').optional().trim().notEmpty().withMessage('La description ne peut pas être vide'),
    body('datePublication').optional().isISO8601().withMessage('Date de publication invalide'),
    body('dateEcheance').optional().isISO8601().withMessage('Date limite invalide'),
    body('statut').optional().isIn(['actif', 'cloture', 'annule']).withMessage('Statut invalide')
  ],
  appelOffreController.updateAppelOffre
);

// DELETE - Supprimer un appel d'offre (protégé)
router.delete('/:id', authenticateToken, appelOffreController.deleteAppelOffre); // ✅ CORRECTION ICI

// GET - Statistiques (protégé)
router.get('/admin/statistics', authenticateToken, appelOffreController.getStatistics); // ✅ CORRECTION ICI

module.exports = router;

