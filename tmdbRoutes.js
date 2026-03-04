const express = require('express');
const {
  getPopularMovies,
  searchMovies,
  getMovieDetails,
  getMovieGenres,
  importMovieFromTMDB
} = require('../controllers/tmdbController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/popular', getPopularMovies);
router.get('/search', searchMovies);
router.get('/genres', getMovieGenres);
router.get('/movie/:movieId', getMovieDetails);

// Ruta protegida (solo admin para importar)
router.post('/import', 
  authMiddleware, 
  roleMiddleware(['admin']), 
  importMovieFromTMDB
);

module.exports = router;
