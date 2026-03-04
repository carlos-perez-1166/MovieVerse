const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY || 'tu_api_key_aqui';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Obtener películas populares de TMDB
exports.getPopularMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        page: page
      }
    });

    res.json({
      movies: response.data.results,
      currentPage: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results
    });
  } catch (error) {
    console.error('Error al obtener películas populares de TMDB:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener películas de TMDB',
      error: error.message 
    });
  }
};

// Buscar películas en TMDB
exports.searchMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'El término de búsqueda es requerido' });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        query: query,
        page: page
      }
    });

    res.json({
      movies: response.data.results,
      currentPage: response.data.page,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
      searchQuery: query
    });
  } catch (error) {
    console.error('Error al buscar películas en TMDB:', error.message);
    res.status(500).json({ 
      message: 'Error al buscar películas en TMDB',
      error: error.message 
    });
  }
};

// Obtener detalles de una película específica
exports.getMovieDetails = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES',
        append_to_response: 'credits,videos,recommendations'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error al obtener detalles de la película:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener detalles de la película',
      error: error.message 
    });
  }
};

// Obtener géneros de películas
exports.getMovieGenres = async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'es-ES'
      }
    });

    res.json(response.data.genres);
  } catch (error) {
    console.error('Error al obtener géneros de TMDB:', error.message);
    res.status(500).json({ 
      message: 'Error al obtener géneros de TMDB',
      error: error.message 
    });
  }
};

// Importar película de TMDB a nuestra base de datos
exports.importMovieFromTMDB = async (req, res) => {
  try {
    const { tmdbId } = req.body;
    
    if (!tmdbId) {
      return res.status(400).json({ message: 'El ID de TMDB es requerido' });
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
      title: tmdbMovie.title,
      synopsis: tmdbMovie.overview,
      genre: mapGenre(tmdbMovie.genres[0]?.name),
      duration: tmdbMovie.runtime,
      popularity: tmdbMovie.popularity,
      price: calculatePrice(tmdbMovie.popularity),
      imageUrl: tmdbMovie.poster_path ? 
        `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
      tmdbId: tmdbMovie.id,
      schedules: generateDefaultSchedules()
    };

    // Importar el modelo Movie aquí para evitar dependencia circular
    const Movie = require('../models/Movie');
    
    // Verificar si la película ya existe
    const existingMovie = await Movie.findOne({ tmdbId: tmdbId });
    if (existingMovie) {
      return res.status(400).json({ 
        message: 'Esta película ya está importada' 
      });
    }

    // Crear la película en nuestra base de datos
    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).json({
      message: 'Película importada exitosamente',
      movie
    });

  } catch (error) {
    console.error('Error al importar película de TMDB:', error.message);
    res.status(500).json({ 
      message: 'Error al importar película de TMDB',
      error: error.message 
    });
  }
};

// Funciones auxiliares
function mapGenre(tmdbGenre) {
  const genreMap = {
    'Action': 'Acción',
    'Comedy': 'Comedia',
    'Drama': 'Drama',
    'Horror': 'Terror',
    'Science Fiction': 'Ciencia Ficción',
    'Romance': 'Romance',
    'Animation': 'Animación',
    'Documentary': 'Documental'
  };
  
  return genreMap[tmdbGenre] || 'Drama';
}

function calculatePrice(popularity) {
  if (popularity > 100) return 150;
  if (popularity > 50) return 120;
  if (popularity > 20) return 100;
  return 80;
}

function generateDefaultSchedules() {
  const schedules = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Agregar horarios para cada día
    schedules.push(new Date(date.setHours(14, 0, 0, 0))); // 2:00 PM
    schedules.push(new Date(date.setHours(17, 0, 0, 0))); // 5:00 PM
    schedules.push(new Date(date.setHours(20, 0, 0, 0))); // 8:00 PM
  }
  
  return schedules;
}
