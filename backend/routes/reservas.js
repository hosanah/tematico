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

// List all reservations with pagination
router.get('/', (req, res, next) => {
  const db = getDatabase();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  db.all(
    'SELECT id, restaurante_id, evento_id, data, horario, numero_pessoas FROM reservas LIMIT ? OFFSET ?',
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error('❌ Erro ao listar reservas:', err.message);
        return next(new ApiError(500, 'Erro ao listar reservas', 'LIST_RESERVATIONS_ERROR', err.message));
      }
      db.get('SELECT COUNT(*) as count FROM reservas', [], (err2, result) => {
        if (err2) {
          console.error('❌ Erro ao contar reservas:', err2.message);
          return next(new ApiError(500, 'Erro ao listar reservas', 'LIST_RESERVATIONS_ERROR', err2.message));
        }
        res.json({ data: rows, total: result.count });
      });
    }
  );
});

// Get single reservation
router.get('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const db = getDatabase();
  db.get('SELECT id, restaurante_id, evento_id, data, horario, numero_pessoas FROM reservas WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error('❌ Erro ao obter reserva:', err.message);
      return next(new ApiError(500, 'Erro ao obter reserva', 'GET_RESERVATION_ERROR', err.message));
    }
    if (!row) {
      return next(new ApiError(404, 'Reserva não encontrada', 'RESERVATION_NOT_FOUND'));
    }
    res.json(row);
  });
});

// Create reservation
router.post('/', (req, res, next) => {
  const { restauranteId, eventoId, data, horario, numeroPessoas } = req.body;
  if (!isValidInt(restauranteId) || !isValidDate(data) || !isValidTime(horario) || !isValidInt(numeroPessoas)) {
    return next(new ApiError(400, 'Dados inválidos para criação de reserva', 'INVALID_FIELDS'));
  }
  const db = getDatabase();
  db.run(
    'INSERT INTO reservas (restaurante_id, evento_id, data, horario, numero_pessoas) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [restauranteId, eventoId || null, data, horario, numeroPessoas],
    function(err) {
      if (err) {
        console.error('❌ Erro ao criar reserva:', err.message);
        return next(new ApiError(500, 'Erro ao criar reserva', 'CREATE_RESERVATION_ERROR', err.message));
      }
      res.status(201).json({ id: this.lastID, restauranteId, eventoId: eventoId || null, data, horario, numeroPessoas });
    }
  );
});

// Update reservation
router.put('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const { restauranteId, eventoId, data, horario, numeroPessoas } = req.body;
  const fields = [];
  const values = [];
  if (restauranteId !== undefined) {
    if (!isValidInt(restauranteId)) return next(new ApiError(400, 'restauranteId deve ser inteiro', 'INVALID_RESTAURANT_ID'));
    fields.push('restaurante_id = ?'); values.push(restauranteId);
  }
  if (eventoId !== undefined) {
    if (eventoId !== null && !isValidInt(eventoId)) return next(new ApiError(400, 'eventoId deve ser inteiro', 'INVALID_EVENT_ID'));
    fields.push('evento_id = ?'); values.push(eventoId);
  }
  if (data) {
    if (!isValidDate(data)) return next(new ApiError(400, 'Data inválida', 'INVALID_DATE'));
    fields.push('data = ?'); values.push(data);
  }
  if (horario) {
    if (!isValidTime(horario)) return next(new ApiError(400, 'Horário inválido', 'INVALID_TIME'));
    fields.push('horario = ?'); values.push(horario);
  }
  if (numeroPessoas !== undefined) {
    if (!isValidInt(numeroPessoas)) return next(new ApiError(400, 'numeroPessoas deve ser inteiro', 'INVALID_PEOPLE_NUMBER'));
    fields.push('numero_pessoas = ?'); values.push(numeroPessoas);
  }
  if (fields.length === 0) {
    return next(new ApiError(400, 'Nenhum dado para atualizar', 'NO_FIELDS_TO_UPDATE'));
  }
  values.push(req.params.id);
  const sql = `UPDATE reservas SET ${fields.join(', ')} WHERE id = ?`;
  const db = getDatabase();
  db.run(sql, values, function(err) {
    if (err) {
      console.error('❌ Erro ao atualizar reserva:', err.message);
      return next(new ApiError(500, 'Erro ao atualizar reserva', 'UPDATE_RESERVATION_ERROR', err.message));
    }
    if (this.changes === 0) {
      return next(new ApiError(404, 'Reserva não encontrada', 'RESERVATION_NOT_FOUND'));
    }
    res.json({ message: 'Reserva atualizada com sucesso' });
  });
});

// Delete reservation
router.delete('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const db = getDatabase();
  db.run('DELETE FROM reservas WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error('❌ Erro ao deletar reserva:', err.message);
      return next(new ApiError(500, 'Erro ao deletar reserva', 'DELETE_RESERVATION_ERROR', err.message));
    }
    if (this.changes === 0) {
      return next(new ApiError(404, 'Reserva não encontrada', 'RESERVATION_NOT_FOUND'));
    }
    res.json({ message: 'Reserva deletada com sucesso' });
  });
});

module.exports = router;
