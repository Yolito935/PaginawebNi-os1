// test-mail.js

// 👇 Agrega esta línea para cargar .env
require('dotenv').config();

const sendMail = require('../mail');

sendMail(
  'angelchencho.04@gmail.com', // Destinatario (tu correo o el del admin)
  'Prueba de correo',
  '<h2>¡Funciona!</h2><p>Este correo se envió desde Node.js con Gmail.</p>'
);