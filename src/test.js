import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

async function testMail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Crypto Analyzer" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // on envoie à la même adresse pour tester
      subject: "Test d'envoi 🚀",
      text: "Si tu reçois ce mail, la configuration fonctionne !"
    });

    console.log('✅ Mail envoyé avec succès !');
    console.log('ID du message:', info.messageId);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testMail(); 