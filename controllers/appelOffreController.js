const AppelOffre = require('../models/AppelOffre');
const fs = require('fs');
const path = require('path');

// Récupérer tous les appels d'offres
exports.getAllAppelsOffres = async (req, res) => {
  try {
    const {
      statut,
      localisation,
      search,
      page = 1,
      limit = 10,
      sortBy = 'datePublication',
      sortOrder = 'DESC'
    } = req.query;

    // Construire les conditions de recherche
    const where = {};

    if (statut) {
      where.statut = statut;
    }

    if (localisation) {
      where.localisation = { [require('sequelize').Op.like]: `%${localisation}%` };
    }

    if (search) {
      where[require('sequelize').Op.or] = [
        { titre: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } },
        { reference: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Récupérer les données
    const { count, rows } = await AppelOffre.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      raw: false
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer un appel d'offre par ID
exports.getAppelOffreById = async (req, res) => {
  try {
    const { id } = req.params;
    const appelOffre = await AppelOffre.findByPk(id);

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: "Appel d'offre non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: appelOffre
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Télécharger le PDF d'un appel d'offre
exports.downloadPdf = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appelOffre = await AppelOffre.findByPk(id, {
      attributes: ['id', 'pdfData', 'pdfOriginalName', 'pdfMimeType', 'pdfSize']
    });

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: "Appel d'offre non trouvé"
      });
    }

    if (!appelOffre.pdfData) {
      return res.status(404).json({
        success: false,
        message: "Aucun PDF disponible pour cet appel d'offre"
      });
    }

    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', appelOffre.pdfMimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${appelOffre.pdfOriginalName || `AO-${id}.pdf`}"`);
    res.setHeader('Content-Length', appelOffre.pdfSize || appelOffre.pdfData.length);

    // Envoyer le buffer du PDF
    res.send(appelOffre.pdfData);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du PDF'
    });
  }
};

// Créer un nouvel appel d'offre
exports.createAppelOffre = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Supprimer le fichier uploadé si erreur de validation
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Vérifier que la référence n'existe pas déjà
    const existingRef = await AppelOffre.findOne({
      where: { reference: req.body.reference }
    });

    if (existingRef) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    // Préparer les données de l'appel d'offre
    const appelOffreData = {
      titre: req.body.titre,
      description: req.body.description,
      datePublication: req.body.datePublication,
      dateEcheance: req.body.dateEcheance,
      reference: req.body.reference,
      montant: req.body.montant || null,
      localisation: req.body.localisation,
      statut: req.body.statut || 'actif'
    };

    // Ajouter le PDF s'il est fourni
    if (req.file) {
      // Lire le contenu du fichier
      const pdfBuffer = fs.readFileSync(req.file.path);
      
      appelOffreData.pdfData = pdfBuffer;
      appelOffreData.pdfOriginalName = req.file.originalname;
      appelOffreData.pdfMimeType = req.file.mimetype;
      appelOffreData.pdfSize = req.file.size;

      // Supprimer le fichier temporaire
      fs.unlinkSync(req.file.path);
    }

    // Créer l'appel d'offre
    const newAppelOffre = await AppelOffre.create(appelOffreData);

    res.status(201).json({
      success: true,
      message: "Appel d'offre créé avec succès",
      data: newAppelOffre
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'appel d'offre:", error);

    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    // Gérer les erreurs de validation Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'appel d'offre",
      error: error.message
    });
  }
};

// Mettre à jour un appel d'offre
exports.updateAppelOffre = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Vérifier si l'appel d'offre existe
    const appelOffre = await AppelOffre.findByPk(req.params.id);

    if (!appelOffre) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Appel d'offre non trouvé"
      });
    }

    // Préparer les données de mise à jour
    const updateData = { ...req.body };

    // Gérer le nouveau PDF si fourni
    if (req.file) {
      // Lire le contenu du nouveau fichier
      const pdfBuffer = fs.readFileSync(req.file.path);
      
      updateData.pdfData = pdfBuffer;
      updateData.pdfOriginalName = req.file.originalname;
      updateData.pdfMimeType = req.file.mimetype;
      updateData.pdfSize = req.file.size;

      // Supprimer le fichier temporaire
      fs.unlinkSync(req.file.path);
      
      // Supprimer l'ancien fichier physique s'il existe (pour la migration)
      if (appelOffre.pdfPath) {
        const oldPdfPath = path.join(__dirname, '..', appelOffre.pdfPath);
        if (fs.existsSync(oldPdfPath)) {
          try {
            fs.unlinkSync(oldPdfPath);
          } catch (err) {
            console.error("Erreur lors de la suppression de l'ancien PDF:", err);
          }
        }
      }
      
      // Supprimer l'ancien chemin
      updateData.pdfPath = null;
    }

    // Mettre à jour l'appel d'offre
    await appelOffre.update(updateData);

    // Recharger pour obtenir les données à jour
    await appelOffre.reload();

    res.json({
      success: true,
      message: "Appel d'offre mis à jour avec succès",
      data: appelOffre
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'appel d'offre:", error);

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Cette référence existe déjà'
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'appel d'offre",
      error: error.message
    });
  }
};

// Supprimer un appel d'offre
exports.deleteAppelOffre = async (req, res) => {
  try {
    const appelOffre = await AppelOffre.findByPk(req.params.id);

    if (!appelOffre) {
      return res.status(404).json({
        success: false,
        message: "Appel d'offre non trouvé"
      });
    }

    // Supprimer le fichier PDF physique si il existe (pour la migration)
    if (appelOffre.pdfPath) {
      const fullPath = path.join(__dirname, '..', appelOffre.pdfPath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error('Erreur lors de la suppression du PDF:', err);
        }
      }
    }

    // Supprimer l'enregistrement
    await appelOffre.destroy();

    res.json({
      success: true,
      message: "Appel d'offre supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'appel d'offre:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'appel d'offre",
      error: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const stats = await AppelOffre.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

