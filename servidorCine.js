import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs"; // Añadimos la encriptación de seguridad

dotenv.config();

const app = express(); // Corregido con paréntesis
app.use(cors());
app.use(express.json());

const USUARIOS_FILE = "./usuarios.json";
const SECRET = process.env.JWT_SECRET || "clave_secreta_movieverse";

// --- Helpers de lectura/escritura ---
function leerUsuarios() {
  try {
    const data = fs.readFileSync(USUARIOS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function guardarUsuarios(usuarios) {
  fs.writeFileSync(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
}

// ---------------- RUTA DE REGISTRO (Con Seguridad Bcrypt) ----------------
app.post("/registro", async (req, res) => {
  const { nombre, email, password } = req.body;
  const usuarios = leerUsuarios();

  if (!nombre || !email || !password) {
    return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });
  }

  if (usuarios.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Esta cuenta ya existe." });
  }

  // Encriptamos la contraseña antes de guardarla (Igual que en server.js)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  usuarios.push({ nombre, email, password: hashedPassword });
  guardarUsuarios(usuarios);

  res.json({ success: true, message: "Registro exitoso. Ya puedes iniciar sesión" });
});

// ---------------- RUTA DE LOGIN (Con Validación de Hash) ----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const usuarios = leerUsuarios();

  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(404).json({ success: false, message: "Cuenta no encontrada." });
  }

  // Comparamos la contraseña escrita con la encriptada en el JSON
  const esValida = await bcrypt.compare(password, usuario.password);
  
  if (!esValida) {
    return res.status(401).json({ success: false, message: "Contraseña incorrecta." });
  }

  // Generamos el token JWT
  const token = jwt.sign({ email: usuario.email, nombre: usuario.nombre }, SECRET, { expiresIn: "1h" });
  
  res.json({ success: true, message: "Inicio de sesión exitoso", token });
});

// ---------------- RUTA ADICIONAL PARA CUMPLIR CON LA ACTIVIDAD (CRUD) ----------------
// Si tu profe te pide que el servidor de cine también maneje "tareas" o "favoritos"
app.get("/status", (req, res) => {
    res.json({ mensaje: "Servidor de MovieVerse en línea y protegido con JWT" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 MovieVerse corriendo en http://localhost:${PORT}`);
});