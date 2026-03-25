// models/Category.js
const { QueryTypes } = require('sequelize');
const {sequelize} = require('../config/db');

class Category {
  /**
   * Récupérer toutes les catégories
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          id,
          nom,
          description,
          slug,
          ordre,
          actif,
          CASE WHEN photo IS NOT NULL AND LENGTH(photo) > 0 THEN 1 ELSE 0 END as hasPhoto,
          created_at,
          updated_at
        FROM categories 
        WHERE 1=1
      `;
      const params = [];

      if (filters.actif !== undefined) {
        query += ' AND actif = ?';
        params.push(filters.actif);
      }

      if (filters.search) {
        query += ' AND (nom LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern);
      }

      query += ' ORDER BY ordre ASC, nom ASC';

      if (filters.limit) {
        query += ' LIMIT ? OFFSET ?';
        params.push(
          parseInt(filters.limit),
          parseInt(filters.offset || 0)
        );
      }

      const categories = await sequelize.query(query, {
        replacements: params,
        type: QueryTypes.SELECT
      });

      // Transformer BLOB en base64 pour le frontend
      if (Array.isArray(categories)) {
        return categories.map(cat => ({
          ...cat,
          photo: cat.photo ? `data:${cat.photo_mime_type};base64,${cat.photo.toString('base64')}` : null
        }));
      }

      return [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer une catégorie par ID
   */
  static async getById(id) {
    try {
      const categories = await sequelize.query(
        'SELECT * FROM categories WHERE id = ?',
        {
          replacements: [id],
          type: QueryTypes.SELECT
        }
      );

      if (!categories || categories.length === 0) return null;

      const category = categories[0];
      return {
        ...category,
        photo: category.photo ? `data:${category.photo_mime_type};base64,${category.photo.toString('base64')}` : null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer une catégorie par slug
   */
  static async getBySlug(slug) {
    try {
      const categories = await sequelize.query(
        `SELECT 
          id,
          nom,
          description,
          slug,
          ordre,
          actif,
          CASE WHEN photo IS NOT NULL AND LENGTH(photo) > 0 THEN 1 ELSE 0 END as hasPhoto,
          created_at,
          updated_at
        FROM categories 
        WHERE slug = ?`,
        {
          replacements: [slug],
          type: QueryTypes.SELECT
        }
      );

      if (!categories || categories.length === 0) return null;

      const category = categories[0];
      return {
        ...category,
        photo: category.photo ? `data:${category.photo_mime_type};base64,${category.photo.toString('base64')}` : null
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Créer une nouvelle catégorie
   */
  static async create(categoryData, photoBuffer) {
    try {
      const { nom, description, slug, ordre, actif } = categoryData;

      const query = `
        INSERT INTO categories 
        (nom, description, slug, photo, photo_mime_type, photo_name, ordre, actif)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        nom,
        description || null,
        slug,
        photoBuffer?.buffer || null,
        photoBuffer?.mimetype || null,
        photoBuffer?.originalname || null,
        ordre || 0,
        actif !== undefined ? actif : true
      ];

      const [result] = await sequelize.query(query, {
        replacements: params,
        type: QueryTypes.INSERT
      });

      return await this.getById(result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour une catégorie
   */
  static async update(id, categoryData, photoBuffer) {
    try {
      const { nom, description, slug, ordre, actif } = categoryData;

      let query = `
        UPDATE categories 
        SET nom = ?, description = ?, slug = ?, ordre = ?, actif = ?, updated_at = CURRENT_TIMESTAMP
      `;
      let params = [nom, description || null, slug, ordre || 0, actif !== undefined ? actif : true];

      // Si une nouvelle photo est fournie
      if (photoBuffer) {
        query += ', photo = ?, photo_mime_type = ?, photo_name = ?';
        params.push(photoBuffer.buffer, photoBuffer.mimetype, photoBuffer.originalname);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await sequelize.query(query, {
        replacements: params,
        type: QueryTypes.UPDATE
      });

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer une catégorie
   */
  static async delete(id) {
    try {
      // Vérifier s'il y a des projets associés
      const projects = await sequelize.query(
        'SELECT COUNT(*) as count FROM projets WHERE category_id = ?',
        {
          replacements: [id],
          type: QueryTypes.SELECT
        }
      );

      const projectCount = projects[0].count;

      if (projectCount > 0) {
        throw new Error(`Impossible de supprimer cette catégorie. ${projectCount} projet(s) y sont associé(s).`);
      }

      await sequelize.query(
        'DELETE FROM categories WHERE id = ?',
        {
          replacements: [id],
          type: QueryTypes.DELETE
        }
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Compter le nombre de catégories
   */
  static async count(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM categories WHERE 1=1';
      const params = [];

      if (filters.actif !== undefined) {
        query += ' AND actif = ?';
        params.push(filters.actif);
      }

      if (filters.search) {
        query += ' AND (nom LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern);
      }

      const result = await sequelize.query(query, {
        replacements: params,
        type: QueryTypes.SELECT
      });

      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;
