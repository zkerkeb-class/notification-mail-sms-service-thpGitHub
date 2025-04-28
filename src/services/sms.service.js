const twilio = require('twilio');
const logger = require('../utils/logger');

// Créer un client Twilio de manière conditionnelle
let client = null;

// Initialisation du client Twilio si les variables d'environnement sont définies
const initTwilioClient = () => {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      logger.info('Client Twilio initialisé avec succès');
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du client Twilio: ${error.message}`);
    }
  }
  
  return client;
};

/**
 * Envoi d'un SMS
 * @param {Object} options - Options d'envoi du SMS
 * @param {string} options.to - Numéro de téléphone du destinataire
 * @param {string} options.message - Contenu du message
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.send = async ({ to, message }) => {
  try {
    // Vérifier si on est en mode simulation
    if (process.env.SMS_SIMULATION === 'true') {
      logger.info(`[SIMULATION] SMS envoyé à ${to}: ${message}`);
      return {
        success: true,
        messageId: `sim-${Date.now()}`,
        recipient: to,
        status: 'sent',
        simulated: true
      };
    }

    // Vérifier si le client Twilio est disponible
    const twilioClient = initTwilioClient();
    
    if (!twilioClient) {
      logger.error('Configuration Twilio manquante - Impossible d\'envoyer le SMS');
      throw new Error('Configuration Twilio manquante dans les variables d\'environnement');
    }
    
    // Formater le numéro si nécessaire (ajouter le préfixe international si absent)
    const formattedNumber = to.startsWith('+') ? to : `+${to}`;
    
    // Envoi du SMS via Twilio
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    logger.info(`SMS envoyé à ${to}: ${sms.sid}`);
    
    return {
      success: true,
      messageId: sms.sid,
      recipient: to,
      status: sms.status
    };
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du SMS à ${to}: ${error.message}`);
    throw new Error(`Erreur lors de l'envoi du SMS: ${error.message}`);
  }
};

/**
 * Envoi de SMS en lot
 * @param {Array<Object>} sms - Tableau de SMS à envoyer
 * @returns {Promise<Array<Object>>} Résultats des envois
 */
exports.sendBatch = async (sms) => {
  const results = [];
  
  for (const message of sms) {
    try {
      const result = await exports.send(message);
      results.push(result);
    } catch (error) {
      logger.error(`Erreur lors de l'envoi en lot à ${message.to}: ${error.message}`);
      results.push({
        success: false,
        error: error.message,
        recipient: message.to
      });
    }
  }
  
  return results;
}; 