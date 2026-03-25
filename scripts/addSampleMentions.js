// scripts/addSampleMentions.js
require('dotenv').config();
const { sequelize } = require('../config/db');
const MentionMedia = require('../models/MentionMedia');

const sampleMentions = [
  {
    titre: 'La SNTP inaugure un nouveau tronçon autoroutier',
    description: 'Un article détaillant les dernières réalisations de la SNTP dans le domaine des infrastructures routières.',
    url: 'https://www.aps.dz/economie/exemple-article-1',
    source: 'APS',
    logoSource: 'https://www.aps.dz/logo.png',
    datePublication: new Date('2024-01-15'),
    type: 'article',
    statut: 'actif',
    featured: true,
    ordre: 1
  },
  {
    titre: 'Interview du DG de la SNTP sur les projets 2024',
    description: 'Le Directeur Général de la SNTP discute des projets majeurs prévus pour l\'année 2024.',
    url: 'https://www.tsa-algerie.com/interview-sntp',
    source: 'TSA',
    logoSource: 'https://www.tsa-algerie.com/logo.png',
    datePublication: new Date('2024-02-20'),
    type: 'interview',
    statut: 'actif',
    featured: false,
    ordre: 2
  },
  {
    titre: 'Reportage vidéo : Les coulisses d\'un chantier SNTP',
    description: 'Un reportage exclusif montrant les différentes étapes de construction d\'un projet autoroutier.',
    url: 'https://www.youtube.com/watch?v=example',
    source: 'Algérie 360',
    logoSource: null,
    datePublication: new Date('2024-03-10'),
    type: 'video',
    statut: 'actif',
    featured: false,
    ordre: 3
  }
];

const addSampleMentions = async () => {
  try {
    console.log('🔄 Ajout des mentions de test...');
    
    for (const mention of sampleMentions) {
      await MentionMedia.create(mention);
      console.log(`✅ Ajouté: ${mention.titre}`);
    }
    
    console.log('\n✅ Toutes les mentions ont été ajoutées');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await sequelize.close();
    process.exit(1);
  }
};

addSampleMentions();

