const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const MovieSQL = require('../models/MovieSQL');
const { verifyToken, requireRole } = require('../middleware/authMiddlewareSQL');
// const { validateMovie, validateMovieUpdate } = require('../middleware/validationMiddleware');

// Rutas públicas
router.get('/', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 12,
      genre: req.query.genre || '',
      minPrice: req.query.minPrice || '',
      maxPrice: req.query.maxPrice || '',
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await MovieSQL.findAll(filters);
    
    res.json({
      message: 'Películas obtenidas exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).json({
      error: 'Error al obtener películas',
      message: error.message
    });
  }
});

router.get('/genres', async (req, res) => {
  try {
    const genres = await MovieSQL.getGenres();
    
    res.json({
      message: 'Géneros obtenidos exitosamente',
      data: genres
    });
  } catch (error) {
    console.error('Error al obtener géneros:', error);
    res.status(500).json({
      error: 'Error al obtener géneros',
      message: error.message
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 12 } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        error: 'Término de búsqueda requerido',
        message: 'Debes proporcionar un término de búsqueda'
      });
    }

    const result = await MovieSQL.search(searchTerm, parseInt(page), parseInt(limit));
    
    res.json({
      message: 'Búsqueda completada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      error: 'Error en búsqueda',
      message: error.message
    });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    
    const result = await MovieSQL.getPopular(parseInt(page), parseInt(limit));
    
    res.json({
      message: 'Películas populares obtenidas exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error al obtener películas populares:', error);
    res.status(500).json({
      error: 'Error al obtener películas populares',
      message: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await MovieSQL.getStats();
    
    res.json({
      message: 'Estadísticas de películas obtenidas exitosamente',
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await MovieSQL.findById(parseInt(id));
    
    if (!movie) {
      return res.status(404).json({
        error: 'Película no encontrada',
        message: 'La película no existe o ha sido eliminada'
      });
    }

    res.json({
      message: 'Película obtenida exitosamente',
      data: movie
    });
  } catch (error) {
    console.error('Error al obtener película:', error);
    res.status(500).json({
      error: 'Error al obtener película',
      message: error.message
    });
  }
});

// Rutas protegidas (requieren token y rol admin)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const movieData = {
      ...req.body,
      titulo: req.body.title, // Mapear campos para compatibilidad
      sinopsis: req.body.synopsis
    };

    const movie = await MovieSQL.create(movieData);
    
    res.status(201).json({
      message: 'Película creada exitosamente',
      data: movie
    });
  } catch (error) {
    console.error('Error al crear película:', error);
    res.status(500).json({
      error: 'Error al crear película',
      message: error.message
    });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const movieData = {
      ...req.body,
      titulo: req.body.title, // Mapear campos para compatibilidad
      sinopsis: req.body.synopsis
    };

    const movie = await MovieSQL.update(parseInt(id), movieData);
    
    if (!movie) {
      return res.status(404).json({
        error: 'Película no encontrada',
        message: 'La película no existe o ha sido eliminada'
      });
    }

    res.json({
      message: 'Película actualizada exitosamente',
      data: movie
    });
  } catch (error) {
    console.error('Error al actualizar película:', error);
    res.status(500).json({
      error: 'Error al actualizar película',
      message: error.message
    });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await MovieSQL.findById(parseInt(id));
    
    if (!movie) {
      return res.status(404).json({
        error: 'Película no encontrada',
        message: 'La película no existe o ya ha sido eliminada'
      });
    }

    await MovieSQL.delete(parseInt(id));
    
    res.json({
      message: 'Película eliminada exitosamente',
      data: {
        id: parseInt(id),
        title: movie.titulo
      }
    });
  } catch (error) {
    console.error('Error al eliminar película:', error);
    res.status(500).json({
      error: 'Error al eliminar película',
      message: error.message
    });
  }
});

module.exports = router;
