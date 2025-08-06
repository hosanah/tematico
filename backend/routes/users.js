const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');

const router = express.Router();

// List all users
router.get('/', (req, res) => {
  const db = getDatabase();
  db.all('SELECT id, username, email, full_name, created_at, updated_at, is_active FROM users', [], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao listar usuários:', err.message);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
    res.json(rows);
  });
});

// Get single user
router.get('/:id', (req, res) => {
  const db = getDatabase();
  db.get('SELECT id, username, email, full_name, created_at, updated_at, is_active FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('❌ Erro ao obter usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao obter usuário' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(row);
  });
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email e senha são obrigatórios' });
    }
    const db = getDatabase();
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existing) => {
      if (err) {
        console.error('❌ Erro ao verificar usuário:', err.message);
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }
      if (existing) {
        return res.status(409).json({ error: 'Usuário ou email já existe' });
      }
      const hashed = await bcrypt.hash(password, 12);
      db.run('INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?) RETURNING id', [username, email, hashed, fullName || username], function(err) {
        if (err) {
          console.error('❌ Erro ao inserir usuário:', err.message);
          return res.status(500).json({ error: 'Erro ao criar usuário' });
        }
        res.status(201).json({ id: this.lastID, username, email, fullName: fullName || username });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { username, email, password, fullName, is_active } = req.body;
    const db = getDatabase();
    db.get('SELECT id FROM users WHERE id = ?', [req.params.id], async (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err.message);
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      const fields = [];
      const values = [];
      if (username) { fields.push('username = ?'); values.push(username); }
      if (email) { fields.push('email = ?'); values.push(email); }
      if (fullName) { fields.push('full_name = ?'); values.push(fullName); }
      if (typeof is_active !== 'undefined') { fields.push('is_active = ?'); values.push(is_active); }
      if (password) {
        const hashed = await bcrypt.hash(password, 12);
        fields.push('password = ?');
        values.push(hashed);
      }
      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado para atualizar' });
      }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      values.push(req.params.id);
      db.run(sql, values, function(err) {
        if (err) {
          console.error('❌ Erro ao atualizar usuário:', err.message);
          return res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
        res.json({ message: 'Usuário atualizado com sucesso' });
      });
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const db = getDatabase();
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error('❌ Erro ao deletar usuário:', err.message);
      return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  });
});

module.exports = router;
