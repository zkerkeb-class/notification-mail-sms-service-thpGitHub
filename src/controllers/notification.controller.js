const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const notificationRepository = require('../repositories/notification.repository');
const logger = require('../utils/logger');

/**
 * Envoi d'un email
 */
exports.sendEmail = async (req, res, next) => {
  try {
    const { to, subject, body, template, data } = req.body;
    
    // Validation des données
    if (!to || !subject || !(body || template)) {
      return res.status(400).json({
        success: false,
        message: 'Les champs "to", "subject" et "body" ou "template" sont requis'
      });
    }

    // Envoi de l'email
    const result = await emailService.send({ to, subject, body, template, data });
    
    // Enregistrement dans l'historique
    await notificationRepository.saveNotification({
      type: 'email',
      recipient: to,
      content: body || `Template: ${template}`,
      status: 'sent',
      metadata: { subject, template, data }
    });

    return res.status(200).json({
      success: true,
      message: 'Email envoyé avec succès',
      data: result
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    return next(error);
  }
};

/**
 * Envoi d'un SMS
 */
exports.sendSMS = async (req, res, next) => {
  try {
    const { to, message } = req.body;
    
    // Validation des données
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Les champs "to" et "message" sont requis'
      });
    }

    // Envoi du SMS
    const result = await smsService.send({ to, message });
    
    // Enregistrement dans l'historique
    await notificationRepository.saveNotification({
      type: 'sms',
      recipient: to,
      content: message,
      status: 'sent'
    });

    return res.status(200).json({
      success: true,
      message: 'SMS envoyé avec succès',
      data: result
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du SMS: ${error.message}`);
    return next(error);
  }
};

/**
 * Envoi d'emails en lot
 */
exports.sendBatchEmails = async (req, res, next) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un tableau "emails" contenant les emails à envoyer est requis'
      });
    }

    const results = await emailService.sendBatch(emails);
    
    // Enregistrement des notifications en lot
    const notifications = emails.map((email, index) => ({
      type: 'email',
      recipient: email.to,
      content: email.body || `Template: ${email.template}`,
      status: results[index].success ? 'sent' : 'failed',
      metadata: { subject: email.subject, template: email.template, data: email.data }
    }));
    
    await notificationRepository.saveBatchNotifications(notifications);

    return res.status(200).json({
      success: true,
      message: `${results.filter(r => r.success).length}/${emails.length} emails envoyés avec succès`,
      data: results
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi des emails en lot: ${error.message}`);
    return next(error);
  }
};

/**
 * Envoi de SMS en lot
 */
exports.sendBatchSMS = async (req, res, next) => {
  try {
    const { sms } = req.body;
    
    if (!sms || !Array.isArray(sms) || sms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un tableau "sms" contenant les SMS à envoyer est requis'
      });
    }

    const results = await smsService.sendBatch(sms);
    
    // Enregistrement des notifications en lot
    const notifications = sms.map((s, index) => ({
      type: 'sms',
      recipient: s.to,
      content: s.message,
      status: results[index].success ? 'sent' : 'failed'
    }));
    
    await notificationRepository.saveBatchNotifications(notifications);

    return res.status(200).json({
      success: true,
      message: `${results.filter(r => r.success).length}/${sms.length} SMS envoyés avec succès`,
      data: results
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi des SMS en lot: ${error.message}`);
    return next(error);
  }
};

/**
 * Envoi combiné (email + SMS)
 */
exports.sendCombined = async (req, res, next) => {
  try {
    const { email, sms } = req.body;
    
    if (!email && !sms) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un des champs "email" ou "sms" est requis'
      });
    }

    const results = {
      email: null,
      sms: null
    };

    // Envoi de l'email si fourni
    if (email) {
      try {
        results.email = await emailService.send(email);
        
        await notificationRepository.saveNotification({
          type: 'email',
          recipient: email.to,
          content: email.body || `Template: ${email.template}`,
          status: 'sent',
          metadata: { subject: email.subject, template: email.template, data: email.data }
        });
      } catch (error) {
        logger.error(`Erreur lors de l'envoi de l'email combiné: ${error.message}`);
        results.email = { success: false, error: error.message };
      }
    }

    // Envoi du SMS si fourni
    if (sms) {
      try {
        results.sms = await smsService.send(sms);
        
        await notificationRepository.saveNotification({
          type: 'sms',
          recipient: sms.to,
          content: sms.message,
          status: 'sent'
        });
      } catch (error) {
        logger.error(`Erreur lors de l'envoi du SMS combiné: ${error.message}`);
        results.sms = { success: false, error: error.message };
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notifications combinées traitées',
      data: results
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi des notifications combinées: ${error.message}`);
    return next(error);
  }
};

/**
 * Récupération de l'historique des notifications
 */
exports.getHistory = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    
    const notifications = await notificationRepository.getNotifications(filters, page, limit);
    const total = await notificationRepository.countNotifications(filters);
    
    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique: ${error.message}`);
    return next(error);
  }
};

/**
 * Récupération d'une notification par ID
 */
exports.getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationRepository.getNotificationById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la notification: ${error.message}`);
    return next(error);
  }
}; 