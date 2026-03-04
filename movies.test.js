const request = require('supertest');
const MySQL = require('MySQL');
const app = require('../app');
const Movie = require('../models/Movie');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

describe('Pruebas de Películas', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Conectar a base de datos de prueba
    const MySQLUri = process.env.MySQL_TEST_URI || 'MySQL://localhost:3000/movieverse_test';
    await MySQL.connect(MYSQLUri);
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada prueba
    await Movie.deleteMany({});
    await User.deleteMany({});

    // Crear usuarios de prueba
    const admin = new User({
      nombre: 'empleado',
      email: 'empleado@movieverse.com',
      password: '2026',
      role: 'admin'
    });
    await admin.save();

    const user = new User({
      nombre: 'usuario',
      email: 'example@gmail.com',
      password: '1016_abc',
      role: 'user'
    });
    await user.save();

    // Generar tokens
    adminToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'clave_secreta_movieverse_2026'
    );

    userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'clave_secreta_movieverse_2026'
    );
  });

  afterAll(async () => {
    await MySQL.connection.close();
  });

  describe('GET /api/movies', () => {
    beforeEach(async () => {
      // Crear películas de prueba
      const movies = [
        {
          title: 'Película de Acción',
          synopsis: 'Una emocionante película de acción',
          genre: 'Acción',
          price: 120,
          duration: 120,
          schedules: [new Date(), new Date()]
        },
        {
          title: 'Comedia Divertida',
          synopsis: 'Una película muy graciosa',
          genre: 'Comedia',
          price: 100,
          duration: 90,
          schedules: [new Date()]
        }
      ];

      await Movie.insertMany(movies);
    });

    it('debería obtener todas las películas', async () => {
      const response = await request(app)
        .get('/api/movies')
        .expect(200);

      expect(response.body.movies).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalItems).toBe(2);
    });

    it('debería filtrar películas por género', async () => {
      const response = await request(app)
        .get('/api/movies?genre=Acción')
        .expect(200);

      expect(response.body.movies).toHaveLength(1);
      expect(response.body.movies[0].genre).toBe('Acción');
    });

    it('debería filtrar películas por precio', async () => {
      const response = await request(app)
        .get('/api/movies?minPrice=110')
        .expect(200);

      expect(response.body.movies).toHaveLength(1);
      expect(response.body.movies[0].price).toBe(120);
    });

    it('debería buscar películas por texto', async () => {
      const response = await request(app)
        .get('/api/movies?search=Comedia')
        .expect(200);

      expect(response.body.movies).toHaveLength(1);
      expect(response.body.movies[0].title).toContain('Comedia');
    });

    it('debería paginar resultados', async () => {
      const response = await request(app)
        .get('/api/movies?page=1&limit=1')
        .expect(200);

      expect(response.body.movies).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(1);
    });
  });

  describe('POST /api/movies', () => {
    const movieData = {
      title: 'Nueva Película',
      synopsis: 'Sinopsis de la nueva película',
      genre: 'Drama',
      price: 110,
      duration: 105,
      schedules: [new Date()]
    };

    it('debería crear película como admin', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(movieData)
        .expect(201);

      expect(response.body.message).toBe('Película creada exitosamente');
      expect(response.body.movie.title).toBe(movieData.title);
    });

    it('debería rechazar creación como usuario regular', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(movieData)
        .expect(403);

      expect(response.body.message).toBe('Acceso denegado');
    });

    it('debería rechazar creación sin autenticación', async () => {
      const response = await request(app)
        .post('/api/movies')
        .send(movieData)
        .expect(401);

      expect(response.body.message).toBe('Token requerido');
    });

    it('debería rechazar datos inválidos', async () => {
      const invalidData = {
        title: 'A', // muy corto
        synopsis: 'Corta', // muy corta
        price: -10 // precio negativo
      };

      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Error de validación');
    });
  });

  describe('GET /api/movies/genres', () => {
    beforeEach(async () => {
      const movies = [
        { title: 'Película 1', genre: 'Acción', synopsis: 'Sinopsis', price: 100, duration: 100, schedules: [new Date()] },
        { title: 'Película 2', genre: 'Comedia', synopsis: 'Sinopsis', price: 100, duration: 100, schedules: [new Date()] },
        { title: 'Película 3', genre: 'Acción', synopsis: 'Sinopsis', price: 100, duration: 100, schedules: [new Date()] }
      ];
      await Movie.insertMany(movies);
    });

    it('debería obtener géneros únicos', async () => {
      const response = await request(app)
        .get('/api/movies/genres')
        .expect(200);

      expect(response.body).toContain('Acción');
      expect(response.body).toContain('Comedia');
      expect(response.body).toHaveLength(2);
    });
  });
});
