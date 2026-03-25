// routes/contact.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');


// ✅ Configuration du transporteur (IDENTIQUE à candidature)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});


/**
 * Route POST pour envoyer un message de contact
 * @route POST /api/contact/send-message
 */
router.post(
  '/send-message',
  [
    body('nom')
      .trim()
      .notEmpty()
      .withMessage('Le nom est requis')
      .isLength({ min: 2 })
      .withMessage('Le nom doit contenir au moins 2 caractères'),
    
    body('email')
      .isEmail()
      .withMessage('Email invalide'),
    
    body('telephone')
      .optional({ checkFalsy: true })
      .matches(/^(0)(2|1|3|5|6|7|9)[0-9]{8}$/)
      .withMessage('Numéro de téléphone algérien invalide'),
    
    body('sujet')
      .trim()
      .notEmpty()
      .withMessage('Le sujet est requis'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Le message est requis')
      .isLength({ min: 10 })
      .withMessage('Le message doit contenir au moins 10 caractères')
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: errors.array()
        });
      }


      const { nom, email, telephone, sujet, message } = req.body;


      // Log de débogage
      console.log('📧 Envoi message de contact:', {
        de: email,
        nom: nom,
        sujet: sujet
      });


      // ✅ Préparer l'email avec design sobre et professionnel
      const mailOptions = {
        from: `SNTP - Site Web <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        replyTo: email,
        subject: `[SNTP Contact] ${sujet}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background-color: #1a1a1a;
      padding: 32px 40px;
      border-bottom: 3px solid #DC143C;
    }
    .header h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section:last-child {
      margin-bottom: 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table tr {
      border-bottom: 1px solid #f0f0f0;
    }
    .info-table tr:last-child {
      border-bottom: none;
    }
    .info-table td {
      padding: 12px 0;
      vertical-align: top;
    }
    .info-table td:first-child {
      width: 140px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
    .info-table td:last-child {
      color: #1a1a1a;
      font-size: 14px;
    }
    .info-table a {
      color: #DC143C;
      text-decoration: none;
    }
    .info-table a:hover {
      text-decoration: underline;
    }
    .subject-box {
      background-color: #f9f9f9;
      padding: 16px 20px;
      border-radius: 4px;
      border-left: 3px solid #DC143C;
    }
    .subject-box p {
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
      margin: 0;
    }
    .message-box {
      background-color: #fafafa;
      padding: 20px;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 24px 40px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }
    .footer p {
      font-size: 12px;
      color: #888;
      margin: 4px 0;
      line-height: 1.5;
    }
    .footer .company-name {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header,
      .content,
      .footer {
        padding: 24px 20px;
      }
      .info-table td:first-child {
        width: 100px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- En-tête -->
    <div class="header">
      <h1>Nouveau message de contact</h1>
    </div>
    
    <!-- Contenu principal -->
    <div class="content">
      <!-- Informations de l'expéditeur -->
      <div class="section">
        <div class="section-title">Informations de contact</div>
        <table class="info-table">
          <tr>
            <td>Nom complet</td>
            <td><strong>${nom}</strong></td>
          </tr>
          <tr>
            <td>Adresse email</td>
            <td><a href="mailto:${email}">${email}</a></td>
          </tr>
          ${telephone ? `
          <tr>
            <td>Téléphone</td>
            <td>${telephone}</td>
          </tr>
          ` : ''}
          <tr>
            <td>Date de réception</td>
            <td>${new Date().toLocaleString('fr-FR', { 
              timeZone: 'Africa/Algiers',
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
          </tr>
        </table>
      </div>

      <!-- Sujet -->
      <div class="section">
        <div class="section-title">Objet du message</div>
        <div class="subject-box">
          <p>${sujet}</p>
        </div>
      </div>

      <!-- Message -->
      <div class="section">
        <div class="section-title">Message</div>
        <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      <p class="company-name">SNTP - Société Nationale des Travaux Publics</p>
      <p>Message reçu via le formulaire de contact du site web officiel</p>
      <p>Ce message nécessite une réponse dans les meilleurs délais</p>
    </div>
  </div>
</body>
</html>
        `
      };


      // ✅ Envoyer l'email
      await transporter.sendMail(mailOptions);


      console.log('✅ Email de contact envoyé avec succès');


      res.status(200).json({
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous contacterons bientôt.'
      });


    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message de contact:', error);
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer ultérieurement.'
      });
    }
  }
);


module.exports = router;
