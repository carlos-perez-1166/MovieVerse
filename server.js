// server.js
import express from "express";
import SQL from "MySQL";
import cors from "cors";
import dotenv from "dotenv";

// Rutas
import authRoutes from "./routes/authRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARES GLOBALES
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   CONEXIÓN A MySQL
========================= */
MySQL
  .connect(process.env.MySQl.URI)
  .then(() => console.log("✅ MySQL conectado correctamente"))
  .catch((err) => console.error("❌ Error al conectar a MySQL:", err));

/* =========================
   RUTAS PRINCIPALES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);

/* =========================
   RUTA DE PRUEBA
========================= */
app.get("/", (req, res) => {
  res.send("🎬 MovieVerse API funcionando");
});

/* =========================
   SERVIDOR
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/pagos"));

app.listen(3000, () => {
  console.log("🔥 Servidor corriendo en http://localhost:3000");
});