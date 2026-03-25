// controllers/mentionMediaController.js
const MentionMedia = require('../models/MentionMedia');
const { Op } = require('sequelize');

// Récupérer toutes les mentions avec filtres
exports.getAllMentions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      statut = 'actif', 
      type,
      featured,
      search,
      sortBy = 'datePublication', 
      sortOrder = 'DESC' 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (statut) {
      where.statut = statut;
    }

    if (type) {
      where.type = type;
    }

    if (featured !== undefined) {
      where.featured = featured === 'true';
    }

    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { source: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await MentionMedia.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder], ['ordre', 'ASC']]
    });

    res.json({
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
    console.error('Erreur lors de la récupération des mentions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mentions',
      error: error.message
    });
  }
};

// Récupérer une mention par ID
exports.getMentionById = async (req, res) => {
  try {
    const { id } = req.params;

    const mention = await MentionMedia.findByPk(id);

    if (!mention) {
      return res.status(404).json({
        success: false,
        message: 'Mention non trouvée'
      });
    }

    res.json({
      success: true,
      data: mention
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la mention:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la mention',
      error: error.message
    });
  }
};

// Créer une nouvelle mention
exports.createMention = async (req, res) => {
  try {
    const { 
      titre, 
      description, 
      url, 
      source,
      logoSource,
      datePublication,
      type,
      statut,
      featured,
      ordre
    } = req.body;

    const mention = await MentionMedia.create({
      titre,
      description,
      url,
      source,
      logoSource,
      datePublication: datePublication || new Date(),
      type: type || 'article',
      statut: statut || 'actif',
      featured: featured || false,
      ordre: ordre || 0
    });

    res.status(201).json({
      success: true,
      message: 'Mention créée avec succès',
      data: mention
    });
  } catch (error) {
    console.error('Erreur lors de la création de la mention:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la mention',
      error: error.message
    });
  }
};

// Mettre à jour une mention
exports.updateMention = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titre, 
      description, 
      url, 
      source,
      logoSource,
      datePublication,
      type,
      statut,
      featured,
      ordre
    } = req.body;

    const mention = await MentionMedia.findByPk(id);

    if (!mention) {
      return res.status(404).json({
        success: false,
        message: 'Mention non trouvée'
      });
    }

    await mention.update({
      titre: titre || mention.titre,
      description: description !== undefined ? description : mention.description,
      url: url || mention.url,
      source: source !== undefined ? source : mention.source,
      logoSource: logoSource !== undefined ? logoSource : mention.logoSource,
      datePublication: datePublication !== undefined ? datePublication : mention.datePublication,
      type: type || mention.type,
      statut: statut || mention.statut,
      featured: featured !== undefined ? featured : mention.featured,
      ordre: ordre !== undefined ? ordre : mention.ordre
    });

    res.json({
      success: true,
      message: 'Mention mise à jour avec succès',
      data: mention
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la mention:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la mention',
      error: error.message
    });
  }
};

// Supprimer une mention
exports.deleteMention = async (req, res) => {
  try {
    const { id } = req.params;

    const mention = await MentionMedia.findByPk(id);

    if (!mention) {
      return res.status(404).json({
        success: false,
        message: 'Mention non trouvée'
      });
    }

    await mention.destroy();

    res.json({
      success: true,
      message: 'Mention supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la mention:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la mention',
      error: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const total = await MentionMedia.count();
    const actifs = await MentionMedia.count({ where: { statut: 'actif' } });
    const archives = await MentionMedia.count({ where: { statut: 'archive' } });
    const featured = await MentionMedia.count({ where: { featured: true } });

    const byType = await MentionMedia.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    res.json({
      success: true,
      data: {
        total,
        actifs,
        archives,
        featured,
        byType: byType.map(t => ({
          type: t.type,
          count: parseInt(t.dataValues.count)
        }))
      }
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

