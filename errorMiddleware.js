// Middleware personalizado para gestión de errores
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Error de validación',
      errors
    });
  }

  // Error de duplicado (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `El campo ${field} ya existe`,
      field
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado'
    });
  }

  // Error de casteo de Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'ID inválido'
    });
  }

  // Error por defecto
  res.status(err.statusCode || 500).json({
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res) => {
  res.status(404).json({
    message: `Ruta ${req.originalUrl} no encontrada`
  });
};

module.exports = { errorHandler, notFound };
