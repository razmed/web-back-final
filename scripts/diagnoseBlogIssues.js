// scripts/diagnoseBlogIssues.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const Article = require('../models/Article');

const diagnose = async () => {
  try {
    console.log('🔍 DIAGNOSTIC DES PROBLÈMES BLOG\n');
    console.log('=====================================\n');

    // 1. Vérifier les articles dans la DB
    console.log('1. Articles dans la base de données:');
    const allArticles = await Article.findAll({
      attributes: ['id', 'titre', 'slug', 'statut', 'typeContenu'],
      limit: 10
    });
    console.log(`   Total: ${allArticles.length} articles`);
    allArticles.forEach(a => {
      console.log(`   - [${a.statut}] ${a.titre} (${a.typeContenu})`);
      console.log(`     Slug: ${a.slug}`);
    });

    // 2. Articles publiés
    console.log('\n2. Articles publiés:');
    const publishedArticles = await Article.findAll({
      where: { statut: 'publie' },
      attributes: ['id', 'titre', 'slug', 'typeContenu']
    });
    console.log(`   Total: ${publishedArticles.length} articles publiés`);

    // 3. Vérifier les slugs
    console.log('\n3. Exemples de slugs:');
    publishedArticles.slice(0, 5).forEach(a => {
      console.log(`   - /${a.slug}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sequelize.close();
    process.exit(1);
  }
};

diagnose();

