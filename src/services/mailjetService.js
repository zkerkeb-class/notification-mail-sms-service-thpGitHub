import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';

dotenv.config();

class MailjetService {
  constructor() {
    this.mailjet = new Mailjet({
      apiKey: process.env.MJ_APIKEY_PUBLIC,
      apiSecret: process.env.MJ_APIKEY_PRIVATE
    });
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const data = {
        Messages: [
          {
            From: {
              Email: process.env.MJ_SENDER_EMAIL,
              Name: process.env.MJ_SENDER_NAME || 'Crypto Analyzer'
            },
            To: [
              {
                Email: to
              }
            ],
            Subject: subject,
            TextPart: text,
            HTMLPart: html
          }
        ]
      };

      const result = await this.mailjet.post('send', { version: 'v3.1' }).request(data);
      return {
        success: true,
        messageId: result.body.Messages[0].To[0].MessageID
      };
    } catch (error) {
      console.error('Erreur envoi mail:', error);
      throw new Error(`Échec envoi mail: ${error.message}`);
    }
  }
}

export const mailjetService = new MailjetService(); 