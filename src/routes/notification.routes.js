const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Routes email
router.post('/email', notificationController.sendEmail);
router.post('/email/batch', notificationController.sendBatchEmails);

// Routes SMS
router.post('/sms', notificationController.sendSMS);
router.post('/sms/batch', notificationController.sendBatchSMS);

// Route combinée (email + SMS)
router.post('/combined', notificationController.sendCombined);

// Route pour consulter l'historique des notifications
router.get('/history', notificationController.getHistory);
router.get('/history/:id', notificationController.getNotificationById);

module.exports = router; 