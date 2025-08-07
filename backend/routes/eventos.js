const express = require('express');
const { getDatabase } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidInt(value) {
  return Number.isInteger(Number(value));
}

// List all events
router.get('/', (req, res, next) => {
  const db = getDatabase();
  db.all('SELECT id, nome, data, horario, restaurante_id FROM eventos', [], (err, rows) => {
    if (err) {
      console.error('❌ Erro ao listar eventos:', err.message);
      return next(new ApiError(500, 'Erro ao listar eventos', 'LIST_EVENTS_ERROR', err.message));
    }
    res.json(rows);
  });
});

// Get single event
router.get('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const db = getDatabase();
  db.get('SELECT id, nome, data, horario, restaurante_id FROM eventos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('❌ Erro ao obter evento:', err.message);
      return next(new ApiError(500, 'Erro ao obter evento', 'GET_EVENT_ERROR', err.message));
    }
    if (!row) {
      return next(new ApiError(404, 'Evento não encontrado', 'EVENT_NOT_FOUND'));
    }
    res.json(row);
  });
});

// Create event
router.post('/', (req, res, next) => {
  const { nome, data, horario, restauranteId } = req.body;
  if (!nome || !isValidDate(data) || !isValidTime(horario) || !isValidInt(restauranteId)) {
    return next(new ApiError(400, 'Dados inválidos para criação de evento', 'INVALID_FIELDS'));
  }
  const db = getDatabase();
  db.run(
    'INSERT INTO eventos (nome, data, horario, restaurante_id) VALUES (?, ?, ?, ?) RETURNING id',
    [nome, data, horario, restauranteId],
    function(err) {
      if (err) {
        console.error('❌ Erro ao criar evento:', err.message);
        return next(new ApiError(500, 'Erro ao criar evento', 'CREATE_EVENT_ERROR', err.message));
      }
      res.status(201).json({ id: this.lastID, nome, data, horario, restauranteId });
    }
  );
});

// Update event
router.put('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const { nome, data, horario, restauranteId } = req.body;
  const fields = [];
  const values = [];
  if (nome) { fields.push('nome = ?'); values.push(nome); }
  if (data) {
    if (!isValidDate(data)) return next(new ApiError(400, 'Data inválida', 'INVALID_DATE'));
    fields.push('data = ?'); values.push(data);
  }
  if (horario) {
    if (!isValidTime(horario)) return next(new ApiError(400, 'Horário inválido', 'INVALID_TIME'));
    fields.push('horario = ?'); values.push(horario);
  }
  if (restauranteId !== undefined) {
    if (!isValidInt(restauranteId)) return next(new ApiError(400, 'RestauranteId deve ser inteiro', 'INVALID_RESTAURANT_ID'));
    fields.push('restaurante_id = ?'); values.push(restauranteId);
  }
  if (fields.length === 0) {
    return next(new ApiError(400, 'Nenhum dado para atualizar', 'NO_FIELDS_TO_UPDATE'));
  }
  values.push(req.params.id);
  const sql = `UPDATE eventos SET ${fields.join(', ')} WHERE id = ?`;
  const db = getDatabase();
  db.run(sql, values, function(err) {
    if (err) {
      console.error('❌ Erro ao atualizar evento:', err.message);
      return next(new ApiError(500, 'Erro ao atualizar evento', 'UPDATE_EVENT_ERROR', err.message));
    }
    if (this.changes === 0) {
      return next(new ApiError(404, 'Evento não encontrado', 'EVENT_NOT_FOUND'));
    }
    res.json({ message: 'Evento atualizado com sucesso' });
  });
});

// Delete event
router.delete('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const db = getDatabase();
  db.run('DELETE FROM eventos WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error('❌ Erro ao deletar evento:', err.message);
      return next(new ApiError(500, 'Erro ao deletar evento', 'DELETE_EVENT_ERROR', err.message));
    }
    if (this.changes === 0) {
      return next(new ApiError(404, 'Evento não encontrado', 'EVENT_NOT_FOUND'));
    }
    res.json({ message: 'Evento deletado com sucesso' });
  });
});

module.exports = router;
