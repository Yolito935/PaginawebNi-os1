// mail.js
const nodemailer = require('nodemailer');
require('dotenv').config(); // ⚠️ Importante: carga las variables de .env

// Configuración del transporte (Gmail)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,    // tu correo de Gmail
    pass: process.env.EMAIL_PASS,    // tu contraseña de aplicación de 16 caracteres
  },
});

// Función para enviar correos
async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // debe coincidir con 'user' arriba
      to,
      subject,
      html,
    });
    console.log('✅ Correo enviado a:', to);
    console.log('ID del mensaje:', info.messageId);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
}

module.exports = sendMail;