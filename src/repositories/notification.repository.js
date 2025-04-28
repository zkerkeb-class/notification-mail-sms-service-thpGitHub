const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Chemin du fichier de stockage (simple JSON pour cet exemple)
// Dans un environnement de production, on utiliserait une base de données
const STORAGE_DIR = path.join(__dirname, '../../data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'notifications.json');

// Assurer que le dossier et le fichier existent
const ensureStorage = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    
    try {
      await fs.access(STORAGE_FILE);
    } catch (error) {
      // Le fichier n'existe pas, on le crée avec un tableau vide
      await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    logger.error(`Erreur lors de l'initialisation du stockage: ${error.message}`);
    throw new Error('Impossible d\'initialiser le stockage');
  }
};

// Lire toutes les notifications
const readNotifications = async () => {
  await ensureStorage();
  
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Erreur lors de la lecture des notifications: ${error.message}`);
    throw new Error('Impossible de lire les notifications');
  }
};

// Écrire les notifications
const writeNotifications = async (notifications) => {
  await ensureStorage();
  
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(notifications, null, 2));
  } catch (error) {
    logger.error(`Erreur lors de l'écriture des notifications: ${error.message}`);
    throw new Error('Impossible d\'écrire les notifications');
  }
};

/**
 * Sauvegarder une notification
 * @param {Object} notification - La notification à sauvegarder
 * @returns {Promise<Object>} La notification sauvegardée
 */
exports.saveNotification = async (notification) => {
  try {
    const notifications = await readNotifications();
    
    const newNotification = {
      id: uuidv4(),
      ...notification,
      timestamp: new Date().toISOString()
    };
    
    notifications.push(newNotification);
    await writeNotifications(notifications);
    
    return newNotification;
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde de la notification: ${error.message}`);
    throw new Error('Impossible de sauvegarder la notification');
  }
};

/**
 * Sauvegarder plusieurs notifications
 * @param {Array<Object>} notifications - Les notifications à sauvegarder
 * @returns {Promise<Array<Object>>} Les notifications sauvegardées
 */
exports.saveBatchNotifications = async (notifications) => {
  try {
    const existingNotifications = await readNotifications();
    
    const newNotifications = notifications.map(notification => ({
      id: uuidv4(),
      ...notification,
      timestamp: new Date().toISOString()
    }));
    
    existingNotifications.push(...newNotifications);
    await writeNotifications(existingNotifications);
    
    return newNotifications;
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde des notifications en lot: ${error.message}`);
    throw new Error('Impossible de sauvegarder les notifications en lot');
  }
};

/**
 * Récupérer les notifications avec pagination et filtres
 * @param {Object} filters - Filtres à appliquer
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Promise<Array<Object>>} Les notifications filtrées et paginées
 */
exports.getNotifications = async (filters = {}, page = 1, limit = 20) => {
  try {
    const notifications = await readNotifications();
    
    // Appliquer les filtres
    let filteredNotifications = [...notifications];
    
    if (filters.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
    }
    
    if (filters.status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === filters.status);
    }
    
    // Trier par date décroissante
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Appliquer la pagination
    const skip = (page - 1) * limit;
    return filteredNotifications.slice(skip, skip + limit);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des notifications: ${error.message}`);
    throw new Error('Impossible de récupérer les notifications');
  }
};

/**
 * Compter le nombre de notifications avec filtres
 * @param {Object} filters - Filtres à appliquer
 * @returns {Promise<number>} Le nombre de notifications
 */
exports.countNotifications = async (filters = {}) => {
  try {
    const notifications = await readNotifications();
    
    // Appliquer les filtres
    let filteredNotifications = [...notifications];
    
    if (filters.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
    }
    
    if (filters.status) {
      filteredNotifications = filteredNotifications.filter(n => n.status === filters.status);
    }
    
    return filteredNotifications.length;
  } catch (error) {
    logger.error(`Erreur lors du comptage des notifications: ${error.message}`);
    throw new Error('Impossible de compter les notifications');
  }
};

/**
 * Récupérer une notification par ID
 * @param {string} id - L'ID de la notification
 * @returns {Promise<Object|null>} La notification ou null si non trouvée
 */
exports.getNotificationById = async (id) => {
  try {
    const notifications = await readNotifications();
    return notifications.find(n => n.id === id) || null;
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la notification ${id}: ${error.message}`);
    throw new Error('Impossible de récupérer la notification');
  }
}; 