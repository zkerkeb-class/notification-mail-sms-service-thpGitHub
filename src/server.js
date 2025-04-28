const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const logger = require('./utils/logger');

// Chargement des variables d'environnement
dotenv.config();

// Vérification de l'existence du fichier .env
const envFilePath = path.join(__dirname, '../.env');
try {
  fs.accessSync(envFilePath, fs.constants.F_OK);
  logger.info('Fichier .env trouvé');
  // Log des variables d'environnement (sans les mots de passe)
  logger.info('Configuration SMTP:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.EMAIL_FROM
  });
} catch (error) {
  logger.warn('Fichier .env non trouvé. Certaines fonctionnalités pourraient ne pas fonctionner correctement.');
  logger.warn('Veuillez créer un fichier .env à partir du modèle .env.example');
}

// Vérification des configurations essentielles
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  logger.warn('Configuration SMTP incomplète. Le service d\'envoi d\'emails ne fonctionnera pas.');
  logger.warn('Pour activer l\'envoi d\'emails, configurez les variables SMTP_HOST, SMTP_USER et SMTP_PASS dans le fichier .env');
}

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  logger.warn('Configuration Twilio incomplète. Le service d\'envoi de SMS ne fonctionnera pas.');
  logger.warn('Pour activer l\'envoi de SMS, configurez les variables TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans le fichier .env');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api', routes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // Personnalisation des messages d'erreur pour les problèmes courants
  let errorMessage = err.message || 'Une erreur est survenue';
  
  if (errorMessage.includes('Configuration SMTP manquante')) {
    errorMessage = 'Service d\'email non configuré. Contactez l\'administrateur.';
  } else if (errorMessage.includes('Configuration Twilio manquante')) {
    errorMessage = 'Service SMS non configuré. Contactez l\'administrateur.';
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT} en mode ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API disponible à l'adresse: http://localhost:${PORT}/api`);
  logger.info(`Test de l'API: http://localhost:${PORT}/api/health`);
});

module.exports = app; 