const jwt = require('jsonwebtoken');
const UserSQL = require('../models/UserSQL');

// Generar token JWT
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'clave_secreta_movieverse',
    { expiresIn: '24h' }
  );
};

// Controlador de registro
const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que los campos requeridos existan
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

    // Crear usuario
    const user = await UserSQL.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'user'
    });

    // Generar token
    const token = generateToken(user.id, user.email, user.role);

    // Actualizar última sesión
    await UserSQL.updateLastSession(user.id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          fechaRegistro: user.fecha_registro,
          ultimaSesion: user.ultima_sesion
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.message.includes('ya está registrado')) {
      return res.status(409).json({
        error: 'Email ya registrado',
        message: 'El email ya está en uso. Intenta con otro email.'
      });
    }

    res.status(500).json({
      error: 'Error en el registro',
      message: 'No se pudo registrar el usuario. Intenta más tarde.'
    });
  }
};

// Controlador de login
const login = async (req, res) => {
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
    const user = await UserSQL.findByEmail(email.toLowerCase().trim());
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await UserSQL.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'El email o la contraseña son incorrectos'
      });
    }

    // Generar token
    const token = generateToken(user.id, user.email, user.role);

    // Actualizar última sesión
    await UserSQL.updateLastSession(user.id);

    res.json({
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          fechaRegistro: user.fecha_registro,
          ultimaSesion: user.ultima_sesion
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
};

// Obtener perfil de usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await UserSQL.findById(userId);
    
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
          fechaRegistro: user.fecha_registro,
          ultimaSesion: user.ultima_sesion,
          activo: user.activo
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      error: 'Error al obtener perfil',
      message: 'No se pudo obtener el perfil del usuario'
    });
  }
};

// Actualizar rol de usuario (solo admin)
const updateRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    
    // Validar que el rol sea válido
    if (!['admin', 'user'].includes(newRole)) {
      return res.status(400).json({
        error: 'Rol inválido',
        message: 'El rol debe ser "admin" o "user"'
      });
    }

    // Evitar que un admin se quite a sí mismo el rol de admin
    if (req.user.userId === userId && newRole !== 'admin') {
      return res.status(400).json({
        error: 'Operación no permitida',
        message: 'No puedes quitarte el rol de administrador a ti mismo'
      });
    }

    const updatedUser = await UserSQL.updateRole(userId, newRole);
    
    if (!updatedUser) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    res.json({
      message: 'Rol actualizado exitosamente',
      data: {
        user: {
          id: updatedUser.id,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          role: updatedUser.role
        }
      }
    });

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      error: 'Error al actualizar rol',
      message: 'No se pudo actualizar el rol del usuario'
    });
  }
};

// Obtener estadísticas de usuarios (solo admin)
const getUserStats = async (req, res) => {
  try {
    const stats = await UserSQL.getStats();
    
    res.json({
      message: 'Estadísticas obtenidas exitosamente',
      data: stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: 'No se pudieron obtener las estadísticas de usuarios'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateRole,
  getUserStats
};
