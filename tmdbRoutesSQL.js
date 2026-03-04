const express = require('express');
const router = express.Router();
const axios = require('axios');
const MovieSQL = require('../models/MovieSQL');
const { verifyToken, requireRole } = require('../middleware/authMiddlewareSQL');

// Configuración de TMDB
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Middleware para verificar API key de TMDB
const checkTmdbApiKey = (req, res, next) => {
  if (!TMDB_API_KEY) {
    return res.status(500).json({
      error: 'TMDB API Key no configurada',
      message: 'La API key de TMDB no está configurada en el servidor'
    });
  }
  next();
};

// Obtener películas populares de TMDB
router.get('/popular', checkTmdbApiKey, async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        page: parseInt(page)
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genre_ids: movie.genre_ids
    }));

    res.json({
      message: 'Películas populares de TMDB obtenidas exitosamente',
      data: {
        movies,
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      }
    });
  } catch (error) {
    console.error('Error al obtener películas populares de TMDB:', error);
    res.status(500).json({
      error: 'Error al obtener películas populares',
      message: 'No se pudieron obtener las películas populares de TMDB'
    });
  }
});

// Buscar películas en TMDB
router.get('/search', checkTmdbApiKey, async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query requerido',
        message: 'Debes proporcionar un término de búsqueda'
      });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        query,
        page: parseInt(page)
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity
    }));

    res.json({
      message: 'Búsqueda en TMDB completada exitosamente',
      data: {
        movies,
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results
      }
    });
  } catch (error) {
    console.error('Error en búsqueda TMDB:', error);
    res.status(500).json({
      error: 'Error en búsqueda',
      message: 'No se pudo realizar la búsqueda en TMDB'
    });
  }
});

// Obtener detalles de una película de TMDB
router.get('/movie/:id', checkTmdbApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [movieResponse, creditsResponse] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES'
        }
      }),
      axios.get(`${TMDB_BASE_URL}/movie/${id}/credits`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'es-ES'
        }
      })
    ]);

    const movie = movieResponse.data;
    const credits = creditsResponse.data;

    const movieDetails = {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      runtime: movie.runtime,
      genres: movie.genres,
      budget: movie.budget,
      revenue: movie.revenue,
      production_companies: movie.production_companies,
      cast: credits.cast.slice(0, 10), // Primer 10 actores
      crew: credits.crew.filter(person => person.job === 'Director').slice(0, 3) // Primer 3 directores
    };

    res.json({
      message: 'Detalles de película obtenidos exitosamente',
      data: movieDetails
    });
  } catch (error) {
    console.error('Error al obtener detalles de película:', error);
    res.status(500).json({
      error: 'Error al obtener detalles',
      message: 'No se pudieron obtener los detalles de la película'
    });
  }
});

// Obtener géneros de TMDB
router.get('/genres', checkTmdbApiKey, async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES'
      }
    });

    const genres = response.data.genres.map(genre => ({
      id: genre.id,
      name: genre.name
    }));

    res.json({
      message: 'Géneros de TMDB obtenidos exitosamente',
      data: genres
    });
  } catch (error) {
    console.error('Error al obtener géneros de TMDB:', error);
    res.status(500).json({
      error: 'Error al obtener géneros',
      message: 'No se pudieron obtener los géneros de TMDB'
    });
  }
});

// Importar película de TMDB a la base de datos local (solo admin)
router.post('/import/:tmdbId', verifyToken, requireRole('admin'), checkTmdbApiKey, async (req, res) => {
  try {
    const { tmdbId } = req.params;
    
    // Verificar si la película ya existe
    const existingMovie = await MovieSQL.findByTmdbId(parseInt(tmdbId));
    if (existingMovie) {
      return res.status(409).json({
        error: 'Película ya importada',
        message: 'Esta película ya existe en la base de datos local'
      });
    }

    // Obtener detalles de la película desde TMDB
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES'
      }
    });

    const tmdbMovie = response.data;

    // Mapear datos de TMDB a nuestro modelo
    const movieData = {
      titulo: tmdbMovie.title,
      sinopsis: tmdbMovie.overview || 'Sin descripción disponible',
      precio: Math.max(50, Math.floor(tmdbMovie.popularity * 10) || 100), // Precio basado en popularidad
      duracion: tmdbMovie.runtime || 120,
      genero: tmdbMovie.genres?.[0]?.name || 'Drama',
      rating: tmdbMovie.adult ? 'R' : 'PG-13',
      imagen_url: tmdbMovie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
        : null,
      tmdb_id: tmdbMovie.id,
      popularidad: tmdbMovie.vote_average || 0,
      schedules: [] // Sin horarios por defecto
    };

    // Crear película en la base de datos local
    const movie = await MovieSQL.create(movieData);

    res.status(201).json({
      message: 'Película importada exitosamente',
      data: movie
    });
  } catch (error) {
    console.error('Error al importar película:', error);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Película no encontrada en TMDB',
        message: 'La película con el ID proporcionado no existe en TMDB'
      });
    }

    res.status(500).json({
      error: 'Error al importar película',
      message: 'No se pudo importar la película desde TMDB'
    });
  }
});

module.exports = router;
