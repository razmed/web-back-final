// routes/mentionsMedias.js
const express = require('express');
const router = express.Router();
const mentionMediaController = require('../controllers/mentionMediaController');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.get('/', mentionMediaController.getAllMentions);
router.get('/:id', mentionMediaController.getMentionById);

// Routes protégées (admin)
router.post('/', authenticateToken, mentionMediaController.createMention);
router.put('/:id', authenticateToken, mentionMediaController.updateMention);
router.delete('/:id', authenticateToken, mentionMediaController.deleteMention);
router.get('/admin/statistics', authenticateToken, mentionMediaController.getStatistics);

module.exports = router;

