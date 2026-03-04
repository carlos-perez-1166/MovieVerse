const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Importar middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const tmdbRoutes = require('./routes/tmdbRoutes');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: {
    message: 'Demasiadas peticiones desde esta IP, intenta más tarde'
  }
});
app.use('/api/', limiter);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieverse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🍿 Conectado a MongoDB');
})
.catch((error) => {
  console.error('❌ Error al conectar a MongoDB:', error);
  process.exit(1);
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/tmdb', tmdbRoutes);

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({ 
    message: '🎬 MovieVerse API funcionando correctamente',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores
app.use(errorHandler);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🎬 Servidor de MovieVerse corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación de la API: http://localhost:${PORT}/api/status`);
});

module.exports = app;
