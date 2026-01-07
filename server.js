// server.js
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const sendMail = require('./mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 👈 Agrega esta línea
app.use(express.static('.'));

// 🔹 Registrar usuario
app.post('/api/register', async (req, res) => {
  const { google_id, email, name, picture } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email y nombre son requeridos' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [google_id || null, email, name, picture]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Usuario ya registrado' });
    }
    const user = result.rows[0];
    await sendMail(
      'angelchencho.04@gmail.com', // 👉 Cambia esto por el correo real del admin
      'Nuevo registro pendiente - Página Niños',
      `<h2>Nuevo usuario: ${user.name}</h2><p>Email: ${user.email}</p>`
    );
    res.status(201).json({ message: 'Registro exitoso. Esperando aprobación.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// 🔹 Aprobar usuario
app.post('/api/approve/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = userResult.rows[0];
    await pool.query('UPDATE users SET status = $1, approved_at = NOW() WHERE id = $2', ['approved', userId]);
    await sendMail(user.email, '¡Cuenta aprobada!', `<h2>¡Hola ${user.name}! Tu cuenta ya está activa.</h2>`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar' });
  }
});

// 🔹 Listar pendientes
app.get('/api/pending', async (req, res) => {






// Ruta para registro manual (formulario)
app.post('/api/register-manual', async (req, res) => {
  const { name, email, phone, age, parent_name } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name, phone, age, parent_name, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [email, name, phone, age, parent_name]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const user = result.rows[0];

    // ✉️ Correo al ADMIN
    await sendMail(
      'admin@gmail.com',
      'Nueva solicitud de registro - Página Niños',
      `
        <h2>Nueva solicitud de registro</h2>
        <p><b>Nombre:</b> ${user.name}</p>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Teléfono:</b> ${user.phone}</p>
        <p><b>Edad:</b> ${user.age}</p>
        <p><b>Padre/Madre:</b> ${user.parent_name}</p>
        <p><b>Estado:</b> Pendiente de aprobación</p>
        <p>Accede al panel de administración para aprobar o rechazar.</p>
      `
    );

    // ✉️ Correo al USUARIO
    await sendMail(
      user.email,
      'Tu cuenta está pendiente de aprobación - Página Niños',
      `
        <h2>¡Hola, ${user.name}!</h2>
        <p>Gracias por registrarte en nuestra página para niños.</p>
        <p>Tu cuenta está <b>pendiente de aprobación</b> por el equipo administrador.</p>
        <p>Recibirás un correo tan pronto como sea aprobada.</p>
        <p>¡Gracias por tu paciencia!</p>
      `
    );

    res.status(201).json({ message: 'Registro exitoso. Esperando aprobación.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});



  try {
    const result = await pool.query("SELECT * FROM users WHERE status = 'pending'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar' });
  }
});






/*Primer codigo */

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`🟢 Backend corriendo en http://localhost:${PORT}`);
});


// Ruta para recibir el callback de Google
app.post('/api/google-callback', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Credencial de Google no recibida' });
  }

  try {
    // Decodificar el JWT de Google (opcional, pero recomendado)
    const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
    const userInfo = await response.json();

    if (userInfo.error_description) {
      return res.status(400).json({ error: userInfo.error_description });
    }

    const { sub: google_id, email, name, picture } = userInfo;

    // Registrar en la base de datos (estado: pending)
    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [google_id, email, name, picture]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Usuario ya registrado' });
    }

    const user = result.rows[0];

    // ✉️ Enviar correo al admin
    await sendMail(
      'admin@gmail.com',
      'Nuevo registro pendiente - Página Niños',
      `<h2>Nuevo usuario: ${user.name}</h2><p>Email: ${user.email}</p>`
    );

    res.json({ message: 'Registro exitoso. Esperando aprobación.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar con Google' });
  }
});