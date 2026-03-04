const express = require("express");
const router = express.Router();
const db = require("../db");
const generarPDF = require("../utils/pdfGenerator");
const enviarCorreo = require("../utils/emailSender");

router.post("/pagar", async (req, res) => {
  const { nombre, correo, telefono, monto } = req.body;

  const estado = "Aprobado";

  const sql = "INSERT INTO pagos (nombre, correo, telefono, monto, estado) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [nombre, correo, telefono, monto, estado], async (err, result) => {
    if (err) return res.status(500).json(err);

    // Generar PDF
    const pdfPath = await generarPDF({ nombre, monto });

    // Enviar correo
    await enviarCorreo(correo, pdfPath);

    res.json({
      mensaje: "Pago exitoso",
      estado,
      pdf: pdfPath
    });
  });
});

module.exports = router;