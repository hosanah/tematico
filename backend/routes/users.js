const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// List all users
router.get('/', (req, res, next) => {
  const db = getDatabase();
  db.all('SELECT id, username, email, full_name, created_at, updated_at, is_active FROM users', [], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao listar usuários:', err.message);
      return next(new ApiError(500, 'Erro ao listar usuários', 'LIST_USERS_ERROR', err.message));
    }
    const formattedRows = rows.map(({ full_name, is_active, ...rest }) => ({
      ...rest,
      fullName: full_name,
      is_active: Boolean(is_active)
    }));
    res.json(formattedRows);
  });
});

// Get single user
router.get('/:id', (req, res, next) => {
  const db = getDatabase();
  db.get('SELECT id, username, email, full_name, created_at, updated_at, is_active FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('❌ Erro ao obter usuário:', err.message);
      return next(new ApiError(500, 'Erro ao obter usuário', 'GET_USER_ERROR', err.message));
    }
    if (!row) {
      return next(new ApiError(404, 'Usuário não encontrado', 'USER_NOT_FOUND'));
    }
    const { full_name, is_active, ...rest } = row;
    res.json({ ...rest, fullName: full_name, is_active: Boolean(is_active) });
  });
});

// Create user
router.post('/', async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password) {
      return next(new ApiError(400, 'Username, email e senha são obrigatórios', 'MISSING_FIELDS'));
    }
    const db = getDatabase();
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existing) => {
      if (err) {
        console.error('❌ Erro ao verificar usuário:', err.message);
        return next(new ApiError(500, 'Erro ao criar usuário', 'CREATE_USER_ERROR', err.message));
      }
      if (existing) {
        return next(new ApiError(409, 'Usuário ou email já existe', 'USER_EXISTS'));
      }
      const hashed = await bcrypt.hash(password, 12);
      db.run('INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?) RETURNING id', [username, email, hashed, fullName || username], function(err) {
        if (err) {
          console.error('❌ Erro ao inserir usuário:', err.message);
          return next(new ApiError(500, 'Erro ao criar usuário', 'CREATE_USER_ERROR', err.message));
        }
        res.status(201).json({ id: this.lastID, username, email, fullName: fullName || username });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { username, email, password, fullName, is_active } = req.body;
    const db = getDatabase();
    db.get('SELECT id FROM users WHERE id = ?', [req.params.id], async (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return next(new ApiError(500, 'Erro ao atualizar usuário', 'UPDATE_USER_ERROR', err.message));
      }
      if (!user) {
        return next(new ApiError(404, 'Usuário não encontrado', 'USER_NOT_FOUND'));
      }
      const fields = [];
      const values = [];
      if (username) { fields.push('username = ?'); values.push(username); }
      if (email) { fields.push('email = ?'); values.push(email); }
      if (fullName) { fields.push('full_name = ?'); values.push(fullName); }
      if (typeof is_active !== 'undefined') {
        const isActiveInt = (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1') ? 1 : 0;
        fields.push('is_active = ?');
        values.push(isActiveInt);
      }
      if (password) {
        const hashed = await bcrypt.hash(password, 12);
        fields.push('password = ?');
        values.push(hashed);
      }
      if (fields.length === 0) {
        return next(new ApiError(400, 'Nenhum dado para atualizar', 'NO_FIELDS_TO_UPDATE'));
      }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(req.params.id);
      db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar usuário:', err.message);
          return next(new ApiError(500, 'Erro ao atualizar usuário', 'UPDATE_USER_ERROR', err.message));
        }
        res.json({ message: 'Usuário atualizado com sucesso' });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

// Deactivate user
router.delete('/:id', (req, res, next) => {
  const db = getDatabase();
  db.run('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error('❌ Erro ao desativar usuário:', err.message);
      return next(new ApiError(500, 'Erro ao desativar usuário', 'DEACTIVATE_USER_ERROR', err.message));
    }
    if (this.changes === 0) {
      return next(new ApiError(404, 'Usuário não encontrado', 'USER_NOT_FOUND'));
    }
    res.json({ message: 'Usuário desativado' });
  });
});

module.exports = router;
