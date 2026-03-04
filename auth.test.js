const request = require('supertest');
const MySQL = require('MySQL');
const app = require('../app');
const User = require('../models/User');

describe('Pruebas de Autenticación', () => {
  beforeAll(async () => {
    // Conectar a base de datos de prueba
    const MySQLUri = process.env.MySQLDB_TEST_URI || 'MySQL://localhost:3000/movieverse_test';
    await MySQL.connect(MySQLUri);
  });

  beforeEach(async () => {
    // Limpiar base de datos antes de cada prueba
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await MySQL.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Usuario registrado correctamente');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.nombre).toBe(userData.nombre);
      expect(response.body.user.role).toBe('user');
    });

    it('debería rechazar registro con email duplicado', async () => {
      const userData = {
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      };

      // Primer registro
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('El usuario ya existe');
    });

    it('debería rechazar registro con datos inválidos', async () => {
      const invalidData = {
        nombre: 'A', // muy corto
        email: 'email_invalido',
        password: '123' // muy corta
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Error de validación');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      const user = new User({
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      });
      await user.save();
    });

    it('debería iniciar sesión exitosamente', async () => {
      const loginData = {
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Inicio de sesión exitoso');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('debería rechazar login con email no existente', async () => {
      const loginData = {
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Credenciales inválidas');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Crear usuario y obtener token
      const user = new User({
        nombre: 'empleado',
        email: 'empleado@movieverse.com',
        password: '2026'
      });
      await user.save();
      userId = user._id;

      // Generar token de prueba
      const jwt = require('jsonwebtoken');
      token = jwt.sign(
        { id: userId, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'clave_secreta_movieverse_2026'
      );
    });

    it('debería obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe('empleado@movieverse.com');
      expect(response.body.nombre).toBe('empleado');
      expect(response.body.password).toBeUndefined(); // No debe incluir contraseña
    });

    it('debería rechazar acceso sin token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toBe('Token requerido');
    });
  });
});
