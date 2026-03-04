// Configuración global para las pruebas
const mongoose = require('mongoose');

beforeAll(async () => {
  // Silenciar console.log durante las pruebas
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Restaurar console
  console.log.mockRestore();
  console.error.mockRestore();
  
  // Cerrar conexión a MongoDB si está abierta
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

// Manejo de promesas no manejadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
