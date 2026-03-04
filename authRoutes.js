const express = require("express");
const { register, login, getProfile, updateRole } = require("../controllers/authController");
const { validateRegister, validateLogin, handleValidationErrors } = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Rutas públicas
router.post("/register", validateRegister, handleValidationErrors, register);
router.post("/login", validateLogin, handleValidationErrors, login);

// Rutas protegidas
router.get("/profile", authMiddleware, getProfile);
router.put("/role", authMiddleware, roleMiddleware(["admin"]), updateRole);

module.exports = router;
