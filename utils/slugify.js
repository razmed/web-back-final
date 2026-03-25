// utils/slugify.js
/**
 * Générer un slug à partir d'une chaîne
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-'); // Éviter tirets multiples
}

module.exports = { generateSlug };
