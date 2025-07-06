import express from 'express';
import { mailController } from './controllers/mailController.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3010; // Changer le port par défaut à 3010

// Middleware pour parser le JSON
app.use(express.json());

// Routes pour les notifications
app.post('/api/notifications/email', mailController.sendMail);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Erreur serveur'
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Service de notification démarré sur http://localhost:${port}`);
}); 