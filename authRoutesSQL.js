const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const { register, login, getProfile, updateRole, getUserStats } = require('../controllers/authControllerSQL');
const { verifyToken, requireRole } = require('../middleware/authMiddlewareSQL');
// const { validateRegister, validateLogin, validateRoleUpdate } = require('../middleware/validationMiddleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas (requieren token)
router.get('/profile', verifyToken, getProfile);

// Rutas de administrador (requieren token y rol admin)
router.put('/role', verifyToken, requireRole('admin'), updateRole);
router.get('/stats', verifyToken, requireRole('admin'), getUserStats);

module.exports = router;
