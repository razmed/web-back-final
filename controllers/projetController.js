// controllers/projetController.js
const { QueryTypes } = require('sequelize');
const Projet = require('../models/Projet');
const fs = require('fs');
const path = require('path');

// Obtenir l'instance sequelize depuis le modèle
const sequelize = Projet.sequelize;

/**
 * Récupérer tous les projets avec leurs catégories
 */
exports.getAllProjets = async (req, res) => {
  try {
    const { 
      category, 
      status, 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'year', 
      sortOrder = 'DESC' 
    } = req.query;
    
    // Construction de la requête SQL de base (SANS UNDERSCORES)
    let query = `
      SELECT 
        p.id,
        p.titre,
        p.description,
        p.location,
        p.year,
        p.status,
        p.latitude,
        p.longitude,
        p.category_id,
        p.createdat,
        p.updatedat,
        c.id as cat_id,
        c.nom as category_nom,
        c.slug as category_slug,
        CASE WHEN p.imagedata IS NOT NULL THEN 1 ELSE 0 END as hasImage
      FROM projets p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    
    const replacements = [];
    
    // Filtrer par catégorie (accepte soit l'ID soit le slug)
    if (category) {
      // Vérifier si c'est un nombre (ID) ou un slug
      if (!isNaN(category)) {
        query += ' AND p.category_id = ?';
        replacements.push(parseInt(category));
      } else {
        query += ' AND c.slug = ?';
        replacements.push(category);
      }
    }
    
    // Filtrer par statut
    if (status) {
      query += ' AND p.status = ?';
      replacements.push(status);
    }
    
    // Recherche textuelle
    if (search) {
      query += ' AND (p.titre LIKE ? OR p.description LIKE ? OR p.location LIKE ?)';
      const searchPattern = `%${search}%`;
      replacements.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Compter le total (avant pagination)
    const countQuery = query.replace(
      /SELECT[\s\S]+FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    
    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });
    
    const total = countResult.total;
    
    // Ajouter le tri
    const validSortFields = ['year', 'titre', 'createdat', 'updatedat', 'location'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'year';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${sortField} ${sortDirection}`;
    
    // Ajouter la pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    replacements.push(parseInt(limit), offset);
    
    // Exécuter la requête
    const projets = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });
    
    // Formater les données pour le frontend
    const projetsFormatted = projets.map(projet => ({
      id: projet.id,
      titre: projet.titre,
      description: projet.description,
      location: projet.location,
      year: projet.year,
      status: projet.status,
      latitude: projet.latitude,
      longitude: projet.longitude,
      category: projet.category_slug || 'autres',
      category_id: projet.category_id,
      category_nom: projet.category_nom,
      hasImage: !!projet.hasImage,
      created_at: projet.createdat,
      updated_at: projet.updatedat
    }));
    
    res.status(200).json({
      success: true,
      data: projetsFormatted,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur getAllProjets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des projets',
      error: error.message 
    });
  }
};

/**
 * Récupérer un projet par ID
 */
exports.getProjetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        c.id as cat_id,
        c.nom as category_nom,
        c.slug as category_slug,
        CASE WHEN p.imagedata IS NOT NULL THEN 1 ELSE 0 END as hasImage
      FROM projets p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    const projets = await sequelize.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    
    if (!projets || projets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Projet non trouvé' 
      });
    }
    
    const projet = projets[0];
    
    // Formater la réponse
    const projetFormatted = {
      id: projet.id,
      titre: projet.titre,
      description: projet.description,
      location: projet.location,
      year: projet.year,
      status: projet.status,
      latitude: projet.latitude,
      longitude: projet.longitude,
      category: projet.category_slug || 'autres',
      category_id: projet.category_id,
      category_nom: projet.category_nom,
      hasImage: !!projet.hasImage,
      created_at: projet.createdat,
      updated_at: projet.updatedat
    };
    
    res.status(200).json({ 
      success: true, 
      data: projetFormatted 
    });
  } catch (error) {
    console.error('Erreur getProjetById:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du projet',
      error: error.message 
    });
  }
};

/**
 * Télécharger l'image d'un projet
 */
exports.downloadImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT imagedata, imageoriginalname, imagemimetype, imagesize FROM projets WHERE id = ?';
    const projets = await sequelize.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    
    if (!projets || projets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Projet non trouvé' 
      });
    }
    
    const projet = projets[0];
    
    if (!projet.imagedata) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucune image disponible pour ce projet' 
      });
    }
    
    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', projet.imagemimetype || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${projet.imageoriginalname || `projet-${id}.jpg`}"`);
    res.setHeader('Content-Length', projet.imagesize || projet.imagedata.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Envoyer le buffer de l'image
    res.send(projet.imagedata);
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du téléchargement de l\'image',
      error: error.message 
    });
  }
};

/**
 * Créer un nouveau projet
 */
exports.createProjet = async (req, res) => {
  try {
    const { titre, category_id, location, year, status, description, latitude, longitude } = req.body;
    
    // Validation de base
    if (!titre) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }
    
    // Préparer les données du projet
    let query = `
      INSERT INTO projets 
      (titre, category_id, location, year, status, description, latitude, longitude, imagedata, imageoriginalname, imagemimetype, imagesize, createdat, updatedat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const replacements = [
      titre,
      category_id || null,
      location || null,
      year || null,
      status || 'in_progress',
      description || null,
      latitude || null,
      longitude || null,
      req.file?.buffer || null,
      req.file?.originalname || null,
      req.file?.mimetype || null,
      req.file?.size || null
    ];
    
    // Créer le projet
    const [result] = await sequelize.query(query, {
      replacements,
      type: QueryTypes.INSERT
    });
    
    // Récupérer le projet créé
    const newProjet = await this.getProjetByIdInternal(result);
    
    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: newProjet
    });
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message
    });
  }
};

/**
 * Mettre à jour un projet
 */
exports.updateProjet = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, category_id, location, year, status, description, latitude, longitude } = req.body;
    
    // Vérifier si le projet existe
    const existingProjet = await this.getProjetByIdInternal(id);
    if (!existingProjet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Projet non trouvé' 
      });
    }
    
    // Construire la requête de mise à jour
    let query = 'UPDATE projets SET titre = ?, category_id = ?, location = ?, year = ?, status = ?, description = ?, latitude = ?, longitude = ?, updatedat = CURRENT_TIMESTAMP';
    let replacements = [
      titre || existingProjet.titre,
      category_id !== undefined ? category_id : existingProjet.category_id,
      location !== undefined ? location : existingProjet.location,
      year !== undefined ? year : existingProjet.year,
      status || existingProjet.status,
      description !== undefined ? description : existingProjet.description,
      latitude !== undefined ? latitude : existingProjet.latitude,
      longitude !== undefined ? longitude : existingProjet.longitude
    ];
    
    // Ajouter l'image si elle est fournie
    if (req.file) {
      query += ', imagedata = ?, imageoriginalname = ?, imagemimetype = ?, imagesize = ?';
      replacements.push(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );
    }
    
    query += ' WHERE id = ?';
    replacements.push(id);
    
    // Exécuter la mise à jour
    await sequelize.query(query, {
      replacements,
      type: QueryTypes.UPDATE
    });
    
    // Récupérer le projet mis à jour
    const updatedProjet = await this.getProjetByIdInternal(id);
    
    res.json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: updatedProjet
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error.message
    });
  }
};

/**
 * Supprimer un projet
 */
exports.deleteProjet = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le projet existe
    const projet = await this.getProjetByIdInternal(id);
    if (!projet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Projet non trouvé' 
      });
    }
    
    // Supprimer le projet
    await sequelize.query('DELETE FROM projets WHERE id = ?', {
      replacements: [id],
      type: QueryTypes.DELETE
    });
    
    res.json({ 
      success: true, 
      message: 'Projet supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error.message
    });
  }
};

/**
 * Obtenir les statistiques des projets
 */
exports.getStatistics = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projets,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as projets_termines,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as projets_en_cours,
        COUNT(DISTINCT category_id) as nombre_categories,
        COUNT(DISTINCT year) as nombre_annees,
        MIN(year) as annee_min,
        MAX(year) as annee_max
      FROM projets
    `;
    
    const [stats] = await sequelize.query(statsQuery, {
      type: QueryTypes.SELECT
    });
    
    // Statistiques par catégorie
    const categoryStatsQuery = `
      SELECT 
        c.id,
        c.nom,
        c.slug,
        COUNT(p.id) as nombre_projets
      FROM categories c
      LEFT JOIN projets p ON c.id = p.category_id
      GROUP BY c.id, c.nom, c.slug
      ORDER BY nombre_projets DESC
    `;
    
    const categoryStats = await sequelize.query(categoryStatsQuery, {
      type: QueryTypes.SELECT
    });
    
    // Statistiques par année
    const yearStatsQuery = `
      SELECT 
        year,
        COUNT(*) as nombre_projets,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as termines,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as en_cours
      FROM projets
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
    `;
    
    const yearStats = await sequelize.query(yearStatsQuery, {
      type: QueryTypes.SELECT
    });
    
    res.json({ 
      success: true, 
      data: {
        global: stats,
        par_categorie: categoryStats,
        par_annee: yearStats
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

/**
 * Méthode interne pour récupérer un projet (réutilisable)
 */
exports.getProjetByIdInternal = async (id) => {
  try {
    const query = `
      SELECT 
        p.*,
        c.id as cat_id,
        c.nom as category_nom,
        c.slug as category_slug
      FROM projets p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    const projets = await sequelize.query(query, {
      replacements: [id],
      type: QueryTypes.SELECT
    });
    
    if (!projets || projets.length === 0) {
      return null;
    }
    
    const projet = projets[0];
    
    return {
      id: projet.id,
      titre: projet.titre,
      description: projet.description,
      location: projet.location,
      year: projet.year,
      status: projet.status,
      latitude: projet.latitude,
      longitude: projet.longitude,
      category: projet.category_slug || 'autres',
      category_id: projet.category_id,
      category_nom: projet.category_nom,
      hasImage: !!projet.imagedata,
      created_at: projet.createdat,
      updated_at: projet.updatedat
    };
  } catch (error) {
    console.error('Erreur getProjetByIdInternal:', error);
    return null;
  }
};
