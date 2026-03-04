const { query, transaction } = require('../database');

class MovieSQL {
  // Obtener todas las películas con filtros y paginación
  static async findAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = 12,
        genre,
        minPrice,
        maxPrice,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const offset = (page - 1) * limit;
      
      // Construir WHERE clause
      let whereClause = 'WHERE is_active = TRUE';
      let params = [];

      if (genre) {
        whereClause += ' AND genero = ?';
        params.push(genre);
      }

      if (minPrice) {
        whereClause += ' AND precio >= ?';
        params.push(minPrice);
      }

      if (maxPrice) {
        whereClause += ' AND precio <= ?';
        params.push(maxPrice);
      }

      if (search) {
        whereClause += ' AND (titulo LIKE ? OR sinopsis LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Validar y construir ORDER BY
      const validSortFields = ['titulo', 'precio', 'created_at', 'popularidad'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

      // Consulta principal
      const sql = `
        SELECT *, 
          (SELECT GROUP_CONCAT(fecha_hora ORDER BY fecha_hora) 
           FROM horarios WHERE pelicula_id = peliculas.id) as horarios
        FROM peliculas 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;
      
      const movies = await query(sql, [...params, limit, offset]);

      // Obtener total para paginación
      const countSql = `SELECT COUNT(*) as total FROM peliculas ${whereClause}`;
      const [totalResult] = await query(countSql, params);
      const total = totalResult.total;

      // Formatear películas
      const formattedMovies = movies.map(movie => ({
        ...movie,
        schedules: movie.horarios ? movie.horarios.split(',') : [],
        horarios: undefined // Eliminar campo temporal
      }));

      return {
        movies: formattedMovies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error('Error al obtener películas: ' + error.message);
    }
  }

  // Obtener película por ID
  static async findById(id) {
    try {
      const movies = await query(`
        SELECT *, 
          (SELECT GROUP_CONCAT(fecha_hora ORDER BY fecha_hora) 
           FROM horarios WHERE pelicula_id = peliculas.id) as horarios
        FROM peliculas 
        WHERE id = ? AND is_active = TRUE
      `, [id]);

      if (movies.length === 0) return null;

      const movie = movies[0];
      movie.schedules = movie.horarios ? movie.horarios.split(',') : [];
      delete movie.horarios;

      return movie;
    } catch (error) {
      throw new Error('Error al obtener película: ' + error.message);
    }
  }

  // Crear nueva película
  static async create(movieData) {
    try {
      const {
        titulo,
        sinopsis,
        precio,
        duracion,
        genero,
        rating,
        imagen_url,
        tmdb_id,
        popularidad,
        schedules = []
      } = movieData;

      return await transaction(async (connection) => {
        // Insertar película
        const [result] = await connection.execute(`
          INSERT INTO peliculas (titulo, sinopsis, precio, duracion, genero, rating, imagen_url, tmdb_id, popularidad)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [titulo, sinopsis, precio, duracion, genero, rating, imagen_url, tmdb_id, popularidad]);

        const movieId = result.insertId;

        // Insertar horarios si existen
        if (schedules.length > 0) {
          const scheduleValues = schedules.map(schedule => [movieId, schedule]);
          await connection.execute(
            'INSERT INTO horarios (pelicula_id, fecha_hora) VALUES ?',
            [scheduleValues]
          );
        }

        return await this.findById(movieId);
      });
    } catch (error) {
      throw new Error('Error al crear película: ' + error.message);
    }
  }

  // Actualizar película
  static async update(id, movieData) {
    try {
      const {
        titulo,
        sinopsis,
        precio,
        duracion,
        genero,
        rating,
        imagen_url,
        tmdb_id,
        popularidad,
        schedules
      } = movieData;

      return await transaction(async (connection) => {
        // Actualizar película
        await connection.execute(`
          UPDATE peliculas 
          SET titulo = ?, sinopsis = ?, precio = ?, duracion = ?, genero = ?, 
              rating = ?, imagen_url = ?, tmdb_id = ?, popularidad = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [titulo, sinopsis, precio, duracion, genero, rating, imagen_url, tmdb_id, popularidad, id]);

        // Actualizar horarios si se proporcionan
        if (schedules !== undefined) {
          // Eliminar horarios existentes
          await connection.execute('DELETE FROM horarios WHERE pelicula_id = ?', [id]);

          // Insertar nuevos horarios
          if (schedules.length > 0) {
            const scheduleValues = schedules.map(schedule => [id, schedule]);
            await connection.execute(
              'INSERT INTO horarios (pelicula_id, fecha_hora) VALUES ?',
              [scheduleValues]
            );
          }
        }

        return await this.findById(id);
      });
    } catch (error) {
      throw new Error('Error al actualizar película: ' + error.message);
    }
  }

  // Eliminar película (soft delete)
  static async delete(id) {
    try {
      await query('UPDATE peliculas SET is_active = FALSE WHERE id = ?', [id]);
    } catch (error) {
      throw new Error('Error al eliminar película: ' + error.message);
    }
  }

  // Obtener géneros únicos
  static async getGenres() {
    try {
      const result = await query(
        'SELECT DISTINCT genero FROM peliculas WHERE is_active = TRUE AND genero IS NOT NULL ORDER BY genero'
      );
      return result.map(row => row.genero);
    } catch (error) {
      throw new Error('Error al obtener géneros: ' + error.message);
    }
  }

  // Buscar películas
  static async search(searchTerm, page = 1, limit = 12) {
    return this.findAll({
      search: searchTerm,
      page,
      limit
    });
  }

  // Obtener películas populares
  static async getPopular(page = 1, limit = 12) {
    return this.findAll({
      sortBy: 'popularidad',
      sortOrder: 'desc',
      page,
      limit
    });
  }

  // Obtener estadísticas de películas
  static async getStats() {
    try {
      const [total, activas, porGenero] = await Promise.all([
        query('SELECT COUNT(*) as total FROM peliculas'),
        query('SELECT COUNT(*) as total FROM peliculas WHERE is_active = TRUE'),
        query(`
          SELECT genero, COUNT(*) as cantidad 
          FROM peliculas 
          WHERE is_active = TRUE AND genero IS NOT NULL 
          GROUP BY genero 
          ORDER BY cantidad DESC
        `)
      ]);

      return {
        total: total[0].total,
        activas: activas[0].total,
        inactivas: total[0].total - activas[0].total,
        porGenero: porGenero
      };
    } catch (error) {
      throw new Error('Error al obtener estadísticas: ' + error.message);
    }
  }
}

module.exports = MovieSQL;
