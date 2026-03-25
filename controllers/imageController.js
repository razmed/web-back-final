// controllers/imageController.js
const Image = require('../models/Image');
const { v4: uuidv4 } = require('uuid');

// Upload une image
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const { altText } = req.body;

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, WEBP'
      });
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 5MB'
      });
    }

    // Générer un nom de fichier unique
    const filename = `${uuidv4()}-${Date.now()}`;

    // Créer un buffer propre pour éviter les problèmes de référence
    const cleanBuffer = Buffer.from(buffer);

    // Créer l'image en BDD
    const image = await Image.create({
      filename,
      originalName: originalname,
      mimetype: mimetype,
      size: cleanBuffer.length,
      data: cleanBuffer,
      altText: altText || null
    });

    res.status(201).json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        url: `/api/images/${image.id}`,
        size: image.size,
        mimetype: image.mimetype
      }
    });
  } catch (error) {
    console.error('Erreur upload image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
};

// Récupérer une image par ID
exports.getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findByPk(id, {
      attributes: ['id', 'data', 'mimetype', 'originalName', 'size']
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    if (!image.data) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnée d\'image disponible'
      });
    }

    // Configurer les headers HTTP corrects
    res.setHeader('Content-Type', image.mimetype);
    res.setHeader('Content-Length', image.data.length);
    res.setHeader('Content-Disposition', `inline; filename="${image.originalName}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
    res.setHeader('ETag', `"${image.id}"`);

    // Envoyer le buffer directement
    res.send(image.data);
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'image',
      error: error.message
    });
  }
};

// Lister toutes les images (admin)
exports.getAllImages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Image.findAndCountAll({
      attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'altText', 'created_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const images = rows.map(img => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
      mimetype: img.mimetype,
      size: img.size,
      altText: img.altText,
      url: `/api/images/${img.id}`,
      createdAt: img.created_at
    }));

    res.json({
      success: true,
      data: images,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur liste images:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des images',
      error: error.message
    });
  }
};

// Supprimer une image
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findByPk(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    // Vérifier si l'image est utilisée par des articles
    const Article = require('../models/Article');
    const usedInArticles = await Article.count({
      where: { imageId: id }
    });

    if (usedInArticles > 0) {
      return res.status(400).json({
        success: false,
        message: `Cette image est utilisée par ${usedInArticles} article(s). Veuillez d'abord modifier ces articles.`
      });
    }

    await image.destroy();

    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};
