const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Base de datos temporal en memoria (para pruebas)
let users = [
  {
    id: 1,
    nombre: 'Administrador',
    email: 'admin@movieverse.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQuOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // Admin123
    role: 'admin',
    fechaRegistro: new Date(),
    ultimaSesion: null,
    activo: true
  },
  {
    id: 2,
    nombre: 'Usuario Prueba',
    email: 'user@movieverse.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQuOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // User123
    role: 'user',
    fechaRegistro: new Date(),
    ultimaSesion: null,
    activo: true
  }
];

let nextUserId = 3;

// Generar token JWT
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'clave_secreta_movieverse',
    { expiresIn: '24h' }
  );
};

// Rutas de autenticación
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar campos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        message: 'Nombre, email y contraseña son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        message: 'El formato del email no es válido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'El email ya está en uso. Intenta con otro email.'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      id: nextUserId++,
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      fechaRegistro: new Date(),
      ultimaSesion: new Date(),
      activo: true
    };

    users.push(newUser);

    // Generar token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email,
          role: newUser.role,
          fechaRegistro: newUser.fechaRegistro,
          ultimaSesion: newUser.ultimaSesion
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error en el registro',
      message: 'No se pudo registrar el usuario. Intenta más tarde.'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario
    const user = users.find(u => u.email === email.toLowerCase().trim() && u.activo);
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos'
      });
    }

    // Actualizar última sesión
    user.ultimaSesion = new Date();

    // Generar token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          fechaRegistro: user.fechaRegistro,
          ultimaSesion: user.ultimaSesion
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el login',
      message: 'No se pudo iniciar sesión. Intenta más tarde.'
    });
  }
});

app.get('/api/auth/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Se requiere un token de autenticación'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_movieverse');
      
      const user = users.find(u => u.id === decoded.userId && u.activo);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          message: 'El usuario no existe'
        });
      }

      res.json({
        message: 'Perfil obtenido exitosamente',
        data: {
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            role: user.role,
            fechaRegistro: user.fechaRegistro,
            ultimaSesion: user.ultimaSesion,
            activo: user.activo
          }
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido o ha expirado'
      });
    }

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'No se pudo obtener el perfil del usuario'
    });
  }
});

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MovieVerse API Simple está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0-simple',
    users: users.length
  });
});

// Ruta para ver usuarios (solo para desarrollo)
app.get('/api/debug/users', (req, res) => {
  const safeUsers = users.map(u => ({
    ...u,
    password: undefined
  }));
  res.json({
    message: 'Usuarios registrados',
    data: safeUsers
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en esta API`
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor MovieVerse Simple corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: Memoria temporal`);
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  console.log(`📝 Estado del servidor: http://localhost:${PORT}/api/status`);
  console.log(`👥 Usuarios registrados: ${users.length}`);
  console.log(`\n🔑 Cuentas de demostración:`);
  console.log(`   Admin: admin@movieverse.com / Admin123`);
  console.log(`   User:  user@movieverse.com / User123`);
});

module.exports = app;
