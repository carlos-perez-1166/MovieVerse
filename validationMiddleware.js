const { body, validationResult } = require('express-validator');

// Validación para registro
exports.validateRegister = [
  body('nombre')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre debe tener entre 3 y 50 caracteres')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
];

// Validación para login
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
];

// Validación para películas
exports.validateMovie = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('El título es requerido y debe tener máximo 200 caracteres')
    .trim()
    .escape(),
  body('synopsis')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La sinopsis debe tener entre 10 y 1000 caracteres')
    .trim()
    .escape(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('schedules')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un horario'),
  body('schedules.*')
    .isISO8601()
    .withMessage('Los horarios deben tener formato válido'),
];

// Middleware para manejar errores de validación
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};
