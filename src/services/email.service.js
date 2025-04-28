const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

// Création du transporteur SMTP de manière conditionnelle
let transporter = null;

// Initialisation du transporteur SMTP si les variables d'environnement sont définies
const initSMTPTransporter = () => {
  if (!transporter && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = parseInt(process.env.SMTP_PORT || '587');
      const secure = port === 465;

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // Pour le développement uniquement
        },
        debug: true // Active les logs de débogage
      });

      logger.info(`Transporteur SMTP initialisé avec succès (${process.env.SMTP_HOST}:${port}, secure: ${secure})`);
      
      // Vérifier la connexion
      transporter.verify(function(error, success) {
        if (error) {
          logger.error('Erreur de connexion SMTP:', error);
        } else {
          logger.info('Connexion SMTP réussie');
        }
      });
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du transporteur SMTP: ${error.message}`);
    }
  }
  
  return transporter;
};

// Charger un template
const loadTemplate = async (templateName) => {
  try {
    const filePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    const templateSource = await fs.readFile(filePath, 'utf-8');
    return handlebars.compile(templateSource);
  } catch (error) {
    logger.error(`Erreur lors du chargement du template ${templateName}: ${error.message}`);
    throw new Error(`Template ${templateName} non trouvé`);
  }
};

/**
 * Envoi d'un email
 * @param {Object} options - Options d'envoi de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} [options.body] - Corps du message (HTML)
 * @param {string} [options.template] - Nom du template à utiliser
 * @param {Object} [options.data] - Données à injecter dans le template
 * @returns {Promise<Object>} Résultat de l'envoi
 */
exports.send = async ({ to, subject, body, template, data = {} }) => {
  try {
    // Vérifier si le transporteur SMTP est disponible
    const smtpTransporter = initSMTPTransporter();
    
    if (!smtpTransporter) {
      logger.error('Configuration SMTP manquante - Impossible d\'envoyer l\'email');
      throw new Error('Configuration SMTP manquante dans les variables d\'environnement');
    }
    
    let html = body;

    // Si un template est fourni, le charger et le compiler
    if (template) {
      const templateFn = await loadTemplate(template);
      // Ajouter l'année en cours pour les templates
      const templateData = {
        ...data,
        currentYear: new Date().getFullYear()
      };
      html = templateFn(templateData);
      logger.info('Template chargé et compilé avec succès');
    }

    // Options de l'email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      html
    };

    logger.info('Tentative d\'envoi d\'email avec les options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    // Envoi de l'email
    const info = await smtpTransporter.sendMail(mailOptions);
    
    logger.info(`Email envoyé avec succès:`, {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return {
      success: true,
      messageId: info.messageId,
      recipient: to
    };
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de l'email à ${to}:`, error);
    throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
  }
};

/**
 * Envoi d'emails en lot
 * @param {Array<Object>} emails - Tableau d'emails à envoyer
 * @returns {Promise<Array<Object>>} Résultats des envois
 */
exports.sendBatch = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await exports.send(email);
      results.push(result);
    } catch (error) {
      logger.error(`Erreur lors de l'envoi en lot à ${email.to}: ${error.message}`);
      results.push({
        success: false,
        error: error.message,
        recipient: email.to
      });
    }
  }
  
  return results;
}; 