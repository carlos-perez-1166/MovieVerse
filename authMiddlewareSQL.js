const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token requerido',
      message: 'Se requiere un token de autenticación'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_movieverse_2026');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Tu sesión ha expirado. Inicia sesión nuevamente.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    } else {
      return res.status(401).json({
        error: 'Error de autenticación',
        message: 'Error al verificar el token'
      });
    }
  }
};

// Middleware para verificar roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }

    // Convertir roles a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos suficientes para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar si es admin (conveniencia)
const requireAdmin = requireRole('admin');

// Middleware opcional para verificar si es el mismo usuario o admin
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'No autenticado',
      message: 'Debes iniciar sesión para acceder a este recurso'
    });
  }

  const targetUserId = parseInt(req.params.userId || req.params.id);
  const isSelf = req.user.userId === targetUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo puedes acceder a tu propia información o ser administrador'
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireSelfOrAdmin
};
