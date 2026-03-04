const mySQL = require("MySQL");

const movieSchema = new MySQL.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  synopsis: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  schedules: [{
    type: Date,
    required: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  genre: {
    type: String,
    required: true,
    enum: ['Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Romance', 'Animación', 'Documental']
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  rating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
    default: 'PG-13'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  tmdbId: {
    type: Number,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt
movieSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices para mejor rendimiento
movieSchema.index({ title: 'text', synopsis: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ popularity: -1 });
movieSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Movie", movieSchema);
