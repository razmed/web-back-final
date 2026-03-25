const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const crypto = require('crypto');

// Générer un token JWT
const genererToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
};

// @desc    Inscription d'un nouvel admin
// @route   POST /api/auth/inscription
// @access  Public (à sécuriser en production)
exports.inscription = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, role, telephone, service } = req.body;

    // Vérifier si l'admin existe déjà
    const adminExistant = await Admin.findOne({ email });
    if (adminExistant) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }

    // Créer le nouvel admin
    const admin = await Admin.create({
      nom,
      prenom,
      email,
      motDePasse,
      role: role || 'editeur',
      telephone,
      service,
      permissions: ['creer', 'modifier', 'voir_stats']
    });

    // Générer le token
    const token = genererToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin créé avec succès.',
      token,
      admin: {
        id: admin._id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription.',
      error: error.message
    });
  }
};

// @desc    Connexion d'un admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Validation
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe.'
      });
    }

    // Trouver l'admin
    const admin = await Admin.findOne({ email }).select('+motDePasse');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    // Vérifier si le compte est actif
    if (!admin.actif) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier si le compte est verrouillé
    if (admin.dateVerrouillage && admin.dateVerrouillage > Date.now()) {
      const minutesRestantes = Math.ceil((admin.dateVerrouillage - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Compte temporairement verrouillé. Réessayez dans ${minutesRestantes} minute(s).`
      });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await admin.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      await admin.incrementerTentatives();
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    // Réinitialiser les tentatives de connexion
    await admin.reinitialiserTentatives();

    // Mettre à jour la dernière connexion
    admin.derniereConnexion = Date.now();
    await admin.save();

    // Générer le token
    const token = genererToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie.',
      token,
      admin: {
        id: admin._id,
        nom: admin.nom,
        prenom: admin.prenom,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        avatar: admin.avatar
      },
      expiresIn: '1d'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion.',
      error: error.message
    });
  }
};

// @desc    Obtenir les informations de l'admin connecté
// @route   GET /api/auth/moi
// @access  Privé
exports.getMoi = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations.',
      error: error.message
    });
  }
};

// @desc    Déconnexion
// @route   POST /api/auth/deconnexion
// @access  Privé
exports.deconnexion = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie.',
      token: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion.',
      error: error.message
    });
  }
};

// @desc    Demander la réinitialisation du mot de passe
// @route   POST /api/auth/mot-de-passe-oublie
// @access  Public
exports.motDePasseOublie = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte avec cet email.'
      });
    }

    // Générer le token de réinitialisation
    const resetToken = admin.genererTokenReset();
    await admin.save();

    // Créer l'URL de réinitialisation
    const resetUrl = `${req.protocol}://${req.get('host')}/admin/reset-password/${resetToken}`;

    // TODO: Envoyer l'email avec le lien de réinitialisation
    // Pour l'instant, retourner le token dans la réponse (à supprimer en production)

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé.',
      resetToken // À supprimer en production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation.',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/reinitialiser-mot-de-passe/:resetToken
// @access  Public
exports.reinitialiserMotDePasse = async (req, res) => {
  try {
    // Hasher le token
    const tokenReset = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const admin = await Admin.findOne({
      tokenResetPassword: tokenReset,
      tokenResetPasswordExpire: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré.'
      });
    }

    // Définir le nouveau mot de passe
    admin.motDePasse = req.body.motDePasse;
    admin.tokenResetPassword = undefined;
    admin.tokenResetPasswordExpire = undefined;
    await admin.save();

    // Générer un nouveau token JWT
    const token = genererToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès.',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe.',
      error: error.message
    });
  }
};

// @desc    Modifier le mot de passe
// @route   PUT /api/auth/modifier-mot-de-passe
// @access  Privé
exports.modifierMotDePasse = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('+motDePasse');

    // Vérifier l'ancien mot de passe
    const motDePasseValide = await admin.comparerMotDePasse(req.body.motDePasseActuel);
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect.'
      });
    }

    // Définir le nouveau mot de passe
    admin.motDePasse = req.body.nouveauMotDePasse;
    await admin.save();

    // Générer un nouveau token
    const token = genererToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès.',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du mot de passe.',
      error: error.message
    });
  }
};

