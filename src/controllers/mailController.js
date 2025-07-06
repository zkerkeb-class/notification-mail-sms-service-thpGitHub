import { mailService } from '../services/mailService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mailController = {
  async sendMail(req, res) {
    try {
      const { to, subject, template, data } = req.body;
      
      if (!to || !subject || !template) {
        return res.status(400).json({
          success: false,
          error: 'Il manque des champs requis : to, subject, et template'
        });
      }

      // Charger le template
      const templatePath = path.join(__dirname, '..', 'templates', 'email', `${template}.html`);
      let templateContent;
      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: `Template ${template} non trouvé`
        });
      }

      // Compiler le template avec les données
      const compiledTemplate = Handlebars.compile(templateContent);
      const html = compiledTemplate(data || {});

      // Envoyer l'email
      const result = await mailService.sendMail({ to, subject, html });
      res.json(result);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du mail:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}; 