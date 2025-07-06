import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendMail({ to, subject, text, html }) {
    try {
      const mailOptions = {
        from: `"Crypto Analyzer" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Erreur envoi mail:', error);
      throw new Error(`Échec envoi mail: ${error.message}`);
    }
  }
}

export const mailService = new MailService(); 