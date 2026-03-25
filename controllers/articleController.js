// controllers/articleController.js - VERSION COMPLÈTE
const Article = require('../models/Article');
const { Op } = require('sequelize');
const slugify = require('slugify');

// Fonction pour générer un slug unique
const generateUniqueSlug = async (titre, id = null) => {
  let slug = slugify(titre, { lower: true, strict: true });
  let count = 0;
  let uniqueSlug = slug;

  while (true) {
    const whereClause = { slug: uniqueSlug };
    if (id) whereClause.id = { [Op.ne]: id };

    const existing = await Article.findOne({ where: whereClause });
    if (!existing) break;

    count++;
    uniqueSlug = `${slug}-${count}`;
  }

  return uniqueSlug;
};

// Récupérer tous les articles (avec mentions médias)
exports.getAllArticles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      statut = 'publie', 
      typeContenu, // Nouveau filtre
      typeMedia,    // Nouveau filtre
      search,
      tags,
      sortBy = 'datePublication', 
      sortOrder = 'DESC' 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (statut) {
      where.statut = statut;
    }

    // Filtre par type de contenu (article ou mention_media)
    if (typeContenu) {
      where.typeContenu = typeContenu;
    }

    // Filtre par type de média (pour les mentions médias)
    if (typeMedia) {
      where.typeMedia = typeMedia;
    }

    if (search) {
      where[Op.or] = [
        { titre: { [Op.like]: `%${search}%` } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where[Op.or] = tagArray.map(tag => ({
        tags: { [Op.like]: `%"${tag}"%` }
      }));
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder], ['ordre', 'ASC']]
    });
    
    const articlesWithImageUrl = rows.map(article => {
      const articleData = article.toJSON();
      if (articleData.imageId) {
        articleData.imageUrl = `${req.protocol}://${req.get('host')}/api/images/${articleData.imageId}`;
      } else if (articleData.imagePrincipale) {
        articleData.imageUrl = articleData.imagePrincipale;
      }
      return articleData;
    });

    res.json({
      success: true,
      data: articlesWithImageUrl,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles',
      error: error.message
    });
  }
};

// Récupérer un article par slug
exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({
      where: { slug, statut: 'publie' }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    const articleData = article.toJSON();
    if (articleData.imageId) {
      articleData.imageUrl = `${req.protocol}://${req.get('host')}/api/images/${articleData.imageId}`;
    } else if (articleData.imagePrincipale) {
      articleData.imageUrl = articleData.imagePrincipale;
    }

    // Incrémenter les vues seulement pour les articles classiques
    if (article.typeContenu === 'article') {
      await article.increment('vues');
    }

    res.json({
      success: true,
      data: articleData
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

// Récupérer un article par ID (admin)
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
};

// Créer un nouvel article ou mention média
exports.createArticle = async (req, res) => {
  try {
    const { 
      titre, 
      extrait, 
      contenu,
      typeContenu = 'article', // Par défaut: article
      urlExterne,
      sourceMedia,
      logoSource,
      typeMedia,
      imagePrincipale,
      imageId,
      auteur,
      datePublication,
      statut,
      tags,
      metaDescription,
      metaKeywords,
      featured,
      ordre
    } = req.body;

    // Générer le slug
    const slug = await generateUniqueSlug(titre);

    // Préparer les données
    const articleData = {
      titre,
      slug,
      extrait,
      typeContenu,
      imagePrincipale,
      imageId,
      auteur: auteur || 'SNTP',
      datePublication: datePublication || new Date(),
      statut: statut || 'brouillon',
      tags: tags || [],
      metaDescription,
      metaKeywords,
      featured: featured || false,
      ordre: ordre || 0
    };

    // Ajouter les champs spécifiques selon le type
    if (typeContenu === 'mention_media') {
      // Pour une mention média
      articleData.urlExterne = urlExterne;
      articleData.sourceMedia = sourceMedia;
      articleData.logoSource = logoSource;
      articleData.typeMedia = typeMedia || 'article';
      articleData.contenu = contenu || null; // Optionnel pour mention média
    } else {
      // Pour un article classique
      articleData.contenu = contenu;
    }

    const article = await Article.create(articleData);

    res.status(201).json({
      success: true,
      message: typeContenu === 'mention_media' 
        ? 'Mention média créée avec succès' 
        : 'Article créé avec succès',
      data: article
    });
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    
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
      message: 'Erreur lors de la création',
      error: error.message
    });
  }
};

// Mettre à jour un article ou mention média
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titre, 
      extrait, 
      contenu,
      typeContenu,
      urlExterne,
      sourceMedia,
      logoSource,
      typeMedia,
      imagePrincipale,
      imageId,
      auteur,
      datePublication,
      statut,
      tags,
      metaDescription,
      metaKeywords,
      featured,
      ordre
    } = req.body;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Si le titre change, générer un nouveau slug
    let slug = article.slug;
    if (titre && titre !== article.titre) {
      slug = await generateUniqueSlug(titre, id);
    }

    // Préparer les données de mise à jour
    const updateData = {
      titre: titre || article.titre,
      slug,
      extrait: extrait !== undefined ? extrait : article.extrait,
      typeContenu: typeContenu || article.typeContenu,
      imagePrincipale: imagePrincipale !== undefined ? imagePrincipale : article.imagePrincipale,
      imageId: imageId !== undefined ? imageId : article.imageId,
      auteur: auteur || article.auteur,
      datePublication: datePublication !== undefined ? datePublication : article.datePublication,
      statut: statut || article.statut,
      tags: tags !== undefined ? tags : article.tags,
      metaDescription: metaDescription !== undefined ? metaDescription : article.metaDescription,
      metaKeywords: metaKeywords !== undefined ? metaKeywords : article.metaKeywords,
      featured: featured !== undefined ? featured : article.featured,
      ordre: ordre !== undefined ? ordre : article.ordre
    };

    // Ajouter les champs spécifiques selon le type
    const finalTypeContenu = typeContenu || article.typeContenu;
    
    if (finalTypeContenu === 'mention_media') {
      updateData.urlExterne = urlExterne !== undefined ? urlExterne : article.urlExterne;
      updateData.sourceMedia = sourceMedia !== undefined ? sourceMedia : article.sourceMedia;
      updateData.logoSource = logoSource !== undefined ? logoSource : article.logoSource;
      updateData.typeMedia = typeMedia !== undefined ? typeMedia : article.typeMedia;
      updateData.contenu = contenu !== undefined ? contenu : article.contenu;
    } else {
      updateData.contenu = contenu !== undefined ? contenu : article.contenu;
    }

    await article.update(updateData);

    res.json({
      success: true,
      message: finalTypeContenu === 'mention_media'
        ? 'Mention média mise à jour avec succès'
        : 'Article mis à jour avec succès',
      data: article
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    
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
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
};

// Supprimer un article ou mention média
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    await article.destroy();

    res.json({
      success: true,
      message: article.typeContenu === 'mention_media'
        ? 'Mention média supprimée avec succès'
        : 'Article supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// Obtenir les statistiques
exports.getStatistics = async (req, res) => {
  try {
    const total = await Article.count();
    const publies = await Article.count({ where: { statut: 'publie' } });
    const brouillons = await Article.count({ where: { statut: 'brouillon' } });
    const archives = await Article.count({ where: { statut: 'archive' } });
    const featured = await Article.count({ where: { featured: true } });
    
    // Statistiques par type de contenu
    const articles = await Article.count({ where: { typeContenu: 'article' } });
    const mentionsMedias = await Article.count({ where: { typeContenu: 'mention_media' } });

    res.json({
      success: true,
      data: {
        total,
        publies,
        brouillons,
        archives,
        featured,
        byType: {
          articles,
          mentionsMedias
        }
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

module.exports = exports;

