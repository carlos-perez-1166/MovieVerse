const express = require("express");
const { 
  getMovies, 
  getMovieById, 
  createMovie, 
  updateMovie, 
  deleteMovie, 
  getGenres 
} = require("../controllers/movieController");
const { validateMovie, handleValidationErrors } = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Rutas públicas (lectura)
router.get("/", getMovies);
router.get("/genres", getGenres);
router.get("/:id", getMovieById);

// Rutas protegidas (solo admin)
router.post("/", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  validateMovie, 
  handleValidationErrors, 
  createMovie
);

router.put("/:id", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  validateMovie, 
  handleValidationErrors, 
  updateMovie
);

router.delete("/:id", 
  authMiddleware, 
  roleMiddleware(["admin"]), 
  deleteMovie
);

module.exports = router;
