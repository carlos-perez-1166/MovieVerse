const { query } = require('../database');
const bcrypt = require('bcryptjs');

class UserSQL {
  // Encontrar usuario por email
  static async findByEmail(email) {
    try {
      const rows = await query(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Error al buscar usuario por email: ' + error.message);
    }
  }

  // Encontrar usuario por ID
  static async findById(id) {
    try {
      const rows = await query(
        'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error('Error al buscar usuario por ID: ' + error.message);
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      const { nombre, email, password, role = 'user' } = userData;
      
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await query(
        'INSERT INTO usuarios (nombre, email, password, role) VALUES (?, ?, ?, ?)',
        [nombre, email, hashedPassword, role]
      );
      
      return await this.findById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El email ya está registrado');
      }
      throw new Error('Error al crear usuario: ' + error.message);
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar última sesión
  static async updateLastSession(userId) {
    try {
      await query(
        'UPDATE usuarios SET ultima_sesion = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      throw new Error('Error al actualizar última sesión: ' + error.message);
    }
  }

  // Actualizar rol de usuario
  static async updateRole(userId, newRole) {
    try {
      await query(
        'UPDATE usuarios SET role = ? WHERE id = ?',
        [newRole, userId]
      );
      
      return await this.findById(userId);
    } catch (error) {
      throw new Error('Error al actualizar rol: ' + error.message);
    }
  }

  // Obtener todos los usuarios (para admin)
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const rows = await query(
        'SELECT id, nombre, email, role, fecha_registro, ultima_sesion, activo FROM usuarios ORDER BY fecha_registro DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      const totalRows = await query('SELECT COUNT(*) as total FROM usuarios');
      
      return {
        users: rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRows[0].total / limit),
          totalItems: totalRows[0].total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new Error('Error al obtener usuarios: ' + error.message);
    }
  }

  // Desactivar usuario (soft delete)
  static async deactivate(userId) {
    try {
      await query(
        'UPDATE usuarios SET activo = FALSE WHERE id = ?',
        [userId]
      );
    } catch (error) {
      throw new Error('Error al desactivar usuario: ' + error.message);
    }
  }

  // Obtener estadísticas de usuarios
  static async getStats() {
    try {
      const [total, activos, admin] = await Promise.all([
        query('SELECT COUNT(*) as total FROM usuarios'),
        query('SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'),
        query('SELECT COUNT(*) as total FROM usuarios WHERE role = "admin"')
      ]);
      
      return {
        total: total[0].total,
        activos: activos[0].total,
        admin: admin[0].total,
        usuarios: activos[0].total - admin[0].total
      };
    } catch (error) {
      throw new Error('Error al obtener estadísticas: ' + error.message);
    }
  }
}

module.exports = UserSQL;
