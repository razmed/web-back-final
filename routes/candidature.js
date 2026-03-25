// routes/candidature.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Configuration de Multer pour stocker en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Mo maximum
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls PDF, DOC et DOCX sont acceptés.'), false);
    }
  }
});

// Configuration du transporteur Nodemailer
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

// Route POST pour candidature spontanée
router.post(
  '/candidature-spontanee',
  upload.single('cv'),
  [
    // CHAMPS OBLIGATOIRES
    body('civilite')
      .notEmpty()
      .withMessage('La civilité est requise')
      .isIn(['M', 'Mme', 'Mlle'])
      .withMessage('Civilité invalide'),
    
    body('nom')
      .trim()
      .notEmpty()
      .withMessage('Le nom est requis')
      .isLength({ min: 2 })
      .withMessage('Le nom doit contenir au moins 2 caractères'),
    
    body('prenom')
      .trim()
      .notEmpty()
      .withMessage('Le prénom est requis')
      .isLength({ min: 2 })
      .withMessage('Le prénom doit contenir au moins 2 caractères'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email invalide'),
    
    body('telephone')
      .trim()
      .notEmpty()
      .withMessage('Le téléphone est requis'),
    
    body('adresse')
      .trim()
      .notEmpty()
      .withMessage('L\'adresse est requise'),
    
    body('experience')
      .notEmpty()
      .withMessage('L\'expérience est requise')
      .isIn(['0-2', '3-5', '6-10', '10+'])
      .withMessage('Valeur d\'expérience invalide'),
    
    body('niveauEtudes')
      .notEmpty()
      .withMessage('Le niveau d\'études est requis')
      .isIn(['Bac', 'Licence', 'Master', 'Doctorat', 'TS', 'Autre'])
      .withMessage('Niveau d\'études invalide'),
    
    body('motivation')
      .trim()
      .notEmpty()
      .withMessage('La motivation est requise')
      .isLength({ min: 50 })
      .withMessage('La motivation doit contenir au moins 50 caractères')
      .isLength({ max: 1000 })
      .withMessage('La motivation ne doit pas dépasser 1000 caractères'),
    
    // CHAMPS OPTIONNELS
    body('metier')
      .optional({ checkFalsy: true })
      .trim(),
    
    body('fonctionSouhaitee')
      .optional({ checkFalsy: true })
      .trim(),
    
    body('salaireSouhaite')
      .optional({ checkFalsy: true })
      .trim()
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }

      // Vérifier que le fichier CV est présent
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Le CV est obligatoire'
        });
      }

      const {
        civilite,
        nom,
        prenom,
        email,
        telephone,
        adresse,
        metier,
        fonctionSouhaitee,
        experience,
        niveauEtudes,
        salaireSouhaite,
        motivation
      } = req.body;

      const cv = req.file;

      // Mapping des valeurs d'expérience pour l'affichage
      const experienceLabels = {
        '0-2': '0 à 2 ans',
        '3-5': '3 à 5 ans',
        '6-10': '6 à 10 ans',
        '10+': 'Plus de 10 ans'
      };

      // Date formatée
      const dateReception = new Date().toLocaleString('fr-FR', {
        timeZone: 'Africa/Algiers',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Préparer l'email avec design sobre et professionnel
      const mailOptions = {
        from: `"SNTP - Recrutement" <${process.env.SMTP_USER}>`,
        to: process.env.RECRUITMENT_EMAIL || 'recrutement@sntp.dz',
        cc: process.env.RECRUITMENT_CC_EMAIL || '',
        subject: `Candidature Spontanée - ${nom.toUpperCase()} ${prenom}${fonctionSouhaitee ? ` - ${fonctionSouhaitee}` : ''}`,
        html: `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                background-color: #f5f5f5;
              }
              .email-container {
                max-width: 650px;
                margin: 20px auto;
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
              }
              .header {
                background-color: #2c3e50;
                color: #ffffff;
                padding: 30px 40px;
                border-bottom: 3px solid #DC143C;
              }
              .header h1 {
                font-size: 22px;
                font-weight: 600;
                margin: 0;
                letter-spacing: -0.5px;
              }
              .header p {
                margin: 8px 0 0 0;
                font-size: 14px;
                color: #bdc3c7;
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
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid #ecf0f1;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .info-table {
                width: 100%;
                border-collapse: collapse;
              }
              .info-table td {
                padding: 10px 0;
                vertical-align: top;
                border-bottom: 1px solid #f5f5f5;
              }
              .info-table tr:last-child td {
                border-bottom: none;
              }
              .info-label {
                font-weight: 500;
                color: #7f8c8d;
                width: 160px;
                font-size: 14px;
              }
              .info-value {
                color: #2c3e50;
                font-size: 14px;
              }
              .info-value strong {
                color: #000000;
                font-weight: 600;
              }
              .motivation-block {
                background-color: #f8f9fa;
                border-left: 3px solid #DC143C;
                padding: 20px;
                margin-top: 12px;
                font-size: 14px;
                line-height: 1.7;
                color: #2c3e50;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .cv-attachment {
                background-color: #ecf0f1;
                padding: 16px 20px;
                border-radius: 4px;
                margin-top: 12px;
                display: flex;
                align-items: center;
                font-size: 14px;
              }
              .cv-icon {
                width: 40px;
                height: 40px;
                background-color: #DC143C;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                margin-right: 16px;
              }
              .cv-info {
                flex: 1;
              }
              .cv-name {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 4px;
              }
              .cv-size {
                color: #7f8c8d;
                font-size: 13px;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 24px 40px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
              }
              .footer-title {
                font-weight: 600;
                color: #2c3e50;
                font-size: 14px;
                margin-bottom: 8px;
              }
              .footer-text {
                color: #7f8c8d;
                font-size: 12px;
                line-height: 1.5;
                margin: 4px 0;
              }
              .timestamp {
                color: #95a5a6;
                font-size: 11px;
                margin-top: 12px;
              }
              a {
                color: #DC143C;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <!-- En-tête -->
              <div class="header">
                <h1>Nouvelle Candidature Spontanée</h1>
                <p>Service Recrutement SNTP</p>
              </div>

              <!-- Contenu -->
              <div class="content">
                <!-- Informations personnelles -->
                <div class="section">
                  <div class="section-title">Informations personnelles</div>
                  <table class="info-table">
                    <tr>
                      <td class="info-label">Nom complet</td>
                      <td class="info-value"><strong>${civilite} ${nom.toUpperCase()} ${prenom}</strong></td>
                    </tr>
                    <tr>
                      <td class="info-label">Email</td>
                      <td class="info-value"><a href="mailto:${email}">${email}</a></td>
                    </tr>
                    <tr>
                      <td class="info-label">Téléphone</td>
                      <td class="info-value">${telephone}</td>
                    </tr>
                    <tr>
                      <td class="info-label">Adresse</td>
                      <td class="info-value">${adresse}</td>
                    </tr>
                  </table>
                </div>

                <!-- Profil professionnel -->
                <div class="section">
                  <div class="section-title">Profil professionnel</div>
                  <table class="info-table">
                    ${metier ? `
                    <tr>
                      <td class="info-label">Métier actuel</td>
                      <td class="info-value"><strong>${metier}</strong></td>
                    </tr>
                    ` : ''}
                    ${fonctionSouhaitee ? `
                    <tr>
                      <td class="info-label">Poste souhaité</td>
                      <td class="info-value"><strong>${fonctionSouhaitee}</strong></td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td class="info-label">Expérience</td>
                      <td class="info-value">${experienceLabels[experience]}</td>
                    </tr>
                    <tr>
                      <td class="info-label">Niveau d'études</td>
                      <td class="info-value">${niveauEtudes}</td>
                    </tr>
                    ${salaireSouhaite ? `
                    <tr>
                      <td class="info-label">Prétention salariale</td>
                      <td class="info-value">${salaireSouhaite} DA/mois</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>

                <!-- Lettre de motivation -->
                <div class="section">
                  <div class="section-title">Lettre de motivation</div>
                  <div class="motivation-block">${motivation}</div>
                </div>

                <!-- CV -->
                <div class="section">
                  <div class="section-title">Curriculum Vitae</div>
                  <div class="cv-attachment">
                    <div class="cv-icon">CV</div>
                    <div class="cv-info">
                      <div class="cv-name">${cv.originalname}</div>
                      <div class="cv-size">${(cv.size / 1024).toFixed(1)} Ko • ${cv.mimetype.split('/')[1].toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pied de page -->
              <div class="footer">
                <div class="footer-title">SNTP - Société Nationale des Travaux Publics</div>
                <p class="footer-text">
                  Cette candidature a été envoyée automatiquement depuis le formulaire<br>
                  de candidature spontanée du site web SNTP.
                </p>
                <p class="timestamp">Reçu le ${dateReception}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: cv.originalname,
            content: cv.buffer,
            contentType: cv.mimetype
          }
        ]
      };

      // Envoyer l'email
      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'Votre candidature a été envoyée avec succès. Nous vous contacterons prochainement.'
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la candidature:', error);

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Le fichier est trop volumineux. Maximum 5 MB.'
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi de votre candidature. Veuillez réessayer ultérieurement.'
      });
    }
  }
);

// Route de test de la configuration email (optionnelle)
router.get('/test-email', async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Configuration email valide' });
  } catch (error) {
    console.error('Erreur de configuration email:', error);
    res.status(500).json({ success: false, message: 'Configuration email invalide', error: error.message });
  }
});

module.exports = router;
