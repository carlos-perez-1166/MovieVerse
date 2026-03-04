const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar módulos SQL
const { initializeDatabase } = require('./database');
const authRoutes = require('./routes/authRoutesSQL');
const movieRoutes = require('./routes/movieRoutesSQL');
const tmdbRoutes = require('./routes/tmdbRoutesSQL');

// Importar middleware
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MovieVerse API SQL está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en esta API`
  });
});

// Inicializar base de datos y iniciar servidor
async function startServer() {
  try {
    // Inicializar base de datos SQL
    await initializeDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor MovieVerse SQL corriendo en puerto ${PORT}`);
      console.log(`📊 Base de datos SQL conectada`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
      console.log(`📝 Estado del servidor: http://localhost:${PORT}/api/status`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rechazo no manejado:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
