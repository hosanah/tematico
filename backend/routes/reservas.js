const express = require('express');
const { getDatabase } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

function isValidString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidInt(value) {
  return Number.isInteger(Number(value));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// List all reservations with pagination
router.get('/', (req, res, next) => {
  const db = getDatabase();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  db.all(
    'SELECT id, idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes FROM reservas LIMIT ? OFFSET ?',
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
  db.get('SELECT id, idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes FROM reservas WHERE id = ?', [req.params.id], (err, row) => {
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
  const { idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes } = req.body;
  if (
    !isValidInt(idreservacm) ||
    !isValidString(numeroreservacm) ||
    !isValidString(coduh) ||
    !isValidString(nome_hospede) ||
    !isValidDate(data_checkin) ||
    !isValidDate(data_checkout) ||
    !isValidInt(qtd_hospedes)
  ) {
    return next(new ApiError(400, 'Dados inválidos para criação de reserva', 'INVALID_FIELDS'));
  }
  const db = getDatabase();
  db.run(
    'INSERT INTO reservas (idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
    [idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes],
    function(err) {
      if (err) {
        console.error('❌ Erro ao criar reserva:', err.message);
        return next(new ApiError(500, 'Erro ao criar reserva', 'CREATE_RESERVATION_ERROR', err.message));
      }
      res.status(201).json({ id: this.lastID, idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes });
    }
  );
});

// Update reservation
router.put('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const { idreservacm, numeroreservacm, coduh, nome_hospede, data_checkin, data_checkout, qtd_hospedes } = req.body;
  const fields = [];
  const values = [];
  if (idreservacm !== undefined) {
    if (!isValidInt(idreservacm)) return next(new ApiError(400, 'idreservacm deve ser inteiro', 'INVALID_IDRESERVACM'));
    fields.push('idreservacm = ?'); values.push(idreservacm);
  }
  if (numeroreservacm !== undefined) {
    if (!isValidString(numeroreservacm)) return next(new ApiError(400, 'numeroreservacm inválido', 'INVALID_NUMERORESERVACM'));
    fields.push('numeroreservacm = ?'); values.push(numeroreservacm);
  }
  if (coduh !== undefined) {
    if (!isValidString(coduh)) return next(new ApiError(400, 'coduh inválido', 'INVALID_CODUH'));
    fields.push('coduh = ?'); values.push(coduh);
  }
  if (nome_hospede !== undefined) {
    if (!isValidString(nome_hospede)) return next(new ApiError(400, 'nome_hospede inválido', 'INVALID_NOME_HOSPEDE'));
    fields.push('nome_hospede = ?'); values.push(nome_hospede);
  }
  if (data_checkin !== undefined) {
    if (!isValidDate(data_checkin)) return next(new ApiError(400, 'data_checkin inválida', 'INVALID_DATA_CHECKIN'));
    fields.push('data_checkin = ?'); values.push(data_checkin);
  }
  if (data_checkout !== undefined) {
    if (!isValidDate(data_checkout)) return next(new ApiError(400, 'data_checkout inválida', 'INVALID_DATA_CHECKOUT'));
    fields.push('data_checkout = ?'); values.push(data_checkout);
  }
  if (qtd_hospedes !== undefined) {
    if (!isValidInt(qtd_hospedes)) return next(new ApiError(400, 'qtd_hospedes deve ser inteiro', 'INVALID_QTD_HOSPEDES'));
    fields.push('qtd_hospedes = ?'); values.push(qtd_hospedes);
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
