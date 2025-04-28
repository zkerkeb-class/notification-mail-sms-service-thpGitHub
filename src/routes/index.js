const express = require('express');
const router = express.Router();
const notificationRoutes = require('./notification.routes');

// Route de base pour tester l'API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service de notification opérationnel',
    timestamp: new Date().toISOString()
  });
});

// Route pour les notifications
router.use('/notifications', notificationRoutes);

module.exports = router; 