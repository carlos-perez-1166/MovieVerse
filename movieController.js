const Movie = require("../models/Movie");

// Obtener todas las películas con filtros y paginación
exports.getMovies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filter = { isActive: true };
    
    if (genre) {
      filter.genre = genre;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Ejecutar consulta
    const movies = await Movie
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Obtener total para paginación
    const total = await Movie.countDocuments(filter);

    res.json({
      movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error al obtener películas:", error);
    res.status(500).json({ message: "Error al obtener películas" });
  }
};

// Obtener película por ID
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie || !movie.isActive) {
      return res.status(404).json({ message: "Película no encontrada" });
    }
    
    res.json(movie);
  } catch (error) {
    console.error("Error al obtener película:", error);
    res.status(500).json({ message: "Error al obtener película" });
  }
};

// Crear película (solo admin)
exports.createMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    
    res.status(201).json({
      message: "Película creada exitosamente",
      movie
    });
  } catch (error) {
    console.error("Error al crear película:", error);
    res.status(400).json({ 
      message: "Error al crear película",
      error: error.message 
    });
  }
};

// Actualizar película (solo admin)
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ message: "Película no encontrada" });
    }
    
    res.json({
      message: "Película actualizada exitosamente",
      movie
    });
  } catch (error) {
    console.error("Error al actualizar película:", error);
    res.status(400).json({ 
      message: "Error al actualizar película",
      error: error.message 
    });
  }
};

// Eliminar película (soft delete, solo admin)
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!movie) {
      return res.status(404).json({ message: "Película no encontrada" });
    }
    
    res.json({
      message: "Película eliminada exitosamente",
      movie
    });
  } catch (error) {
    console.error("Error al eliminar película:", error);
    res.status(500).json({ message: "Error al eliminar película" });
  }
};

// Obtener géneros disponibles
exports.getGenres = async (req, res) => {
  try {
    const genres = await Movie.distinct('genre');
    res.json(genres);
  } catch (error) {
    console.error("Error al obtener géneros:", error);
    res.status(500).json({ message: "Error al obtener géneros" });
  }
};
