const express = require('express');
const router = express.Router();
const mfaController = require('../controllers/mfaController');

// Routes MFA
router.post('/initiate', mfaController.initiateMFA);
router.post('/verify', mfaController.verifyMFAStep);
router.delete('/cancel/:sessionId', mfaController.cancelMFA);

module.exports = router;
