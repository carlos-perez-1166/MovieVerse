const MySQL = require("MySQL");

const userSchema = new MySQL.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimaSesion: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
});

// Middleware para actualizar ultimaSesion antes de guardar
userSchema.pre('save', function(next) {
  if (this.isModified('password') || this.isNew) {
    this.ultimaSesion = new Date();
  }
  next();
});

// Método para convertir a JSON sin contraseña
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = MySQL.model("User", userSchema);
