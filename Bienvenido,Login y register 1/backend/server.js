// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Reemplaza con tu URL de Neon (PostgreSQL gratis)
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_WTmFhZtv4Kw9@ep-super-truth-ahzsxjdc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// 📧 Configuración de Gmail (usa "App Password")
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tu-email@gmail.com',        // ← tu correo
    pass: 'tu-app-password'           // ← App Password (NO tu contraseña normal)
  }
});

const ADMIN_EMAIL = 'admin@tudominio.com'; // ← tu correo de admin

// 🌐 Ruta: registro desde frontend
app.post('/Register', async (req, res) => {
  const { nombre, email, google_id, foto_url } = req.body;

  try {
    // Guardar en PostgreSQL
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, google_id, foto_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [nombre, email, google_id, foto_url]
    );

    const userId = result.rows[0].id;

    // ✉️ Enviar correo al administrador - Gmail
    if (transporter.options.auth.user === 'tu-email@gmail.com') {
      console.log('⚠️ [SIMULATION] Email would be sent to:', ADMIN_EMAIL);
      console.log('Subject:', `Nueva solicitud de registro: ${nombre}`);
      console.log('Body Preview:', `User ${nombre} (${email}) applied`);
    } else {
      await transporter.sendMail({
        from: 'tu-email@gmail.com',
        to: ADMIN_EMAIL,
        subject: `Nueva solicitud de registro: ${nombre}`,
        html: `
          <p><strong>${nombre}</strong> quiere registrarse.</p>
          <p>Email: ${email}</p>
          <p>
            <a href="https://tu-backend.onrender.com/aprobar?id=${userId}" 
               style="display:inline-block;padding:10px;background:#4CAF50;color:white;text-decoration:none;border-radius:4px">
              ✅ Aprobar cuenta
            </a>
          </p>
        `
      });
    }

    res.json({ ok: true, mensaje: 'Registro enviado. Espera la aprobación.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar.' });
  }
});

// ✅ Ruta: aprobar usuario (solo tú la usas) En gmail
app.get('/aprobar', async (req, res) => {
  const { id } = req.query;

  try {
    // Actualizar estado a "aprobado"
    const result = await pool.query(
      `UPDATE usuarios SET estado = 'aprobado' WHERE id = $1 RETURNING email, nombre`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Usuario no encontrado.');
    }

    const { email, nombre } = result.rows[0];

 if (transporter.options.auth.user === 'tu-email@gmail.com') {
      console.log('⚠️ [SIMULATION] Email would be sent to:', email);
      console.log('Subject:', 'Tu cuenta ha sido aprobada!');
      console.log('Body Preview:', `User ${nombre} (${email}) approved`);
    } else {


    }
    // ✉️ Notificar al usuario . Gmail
    await transporter.sendMail({
      from: 'tu-email@gmail.com',
      to: email,
      subject: '¡Tu cuenta ha sido aprobada!',
      html: `<p>Hola ${nombre}, tu cuenta ya está activa. ¡Puedes iniciar sesión!</p>`
    });

    res.send('<h2>✅ Usuario aprobado. Correo enviado.</h2>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al aprobar.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});