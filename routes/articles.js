// routes/articles.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const articleController = require('../controllers/articleController');

// GET - Obtenir tous les articles (public)
router.get('/', articleController.getAllArticles);

// GET - Obtenir un article par ID (public)
router.get('/:id', articleController.getArticleById);

// GET - Obtenir un article par slug (public)
router.get('/slug/:slug', articleController.getArticleBySlug);

// POST - Créer un nouvel article (protégé)
router.post(
  '/',
  authenticateToken,
  [
    body('titre').trim().notEmpty().withMessage('Le titre est requis'),
    body('slug').trim().notEmpty().withMessage('Le slug est requis'),
    body('contenu').trim().notEmpty().withMessage('Le contenu est requis'),
    body('statut').optional().isIn(['brouillon', 'publie', 'archive']).withMessage('Statut invalide'),
    body('datePublication').optional().isISO8601().withMessage('Date de publication invalide'),
    body('tags').optional().isArray().withMessage('Les tags doivent être un tableau')
  ],
  articleController.createArticle
);

// PUT - Mettre à jour un article (protégé)
router.put(
  '/:id',
  authenticateToken,
  [
    body('titre').optional().trim().notEmpty().withMessage('Le titre ne peut pas être vide'),
    body('slug').optional().trim().notEmpty().withMessage('Le slug ne peut pas être vide'),
    body('contenu').optional().trim().notEmpty().withMessage('Le contenu ne peut pas être vide'),
    body('statut').optional().isIn(['brouillon', 'publie', 'archive']).withMessage('Statut invalide'),
    body('datePublication').optional().isISO8601().withMessage('Date de publication invalide'),
    body('tags').optional().isArray().withMessage('Les tags doivent être un tableau')
  ],
  articleController.updateArticle
);

// DELETE - Supprimer un article (protégé)
router.delete('/:id', authenticateToken, articleController.deleteArticle);

// GET - Obtenir les statistiques (protégé)
router.get('/admin/statistics', authenticateToken, articleController.getStatistics);

module.exports = router;

