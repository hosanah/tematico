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

// List all events with pagination
router.get('/', (req, res, next) => {
  const db = getDatabase();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  db.all(
    'SELECT e.id, e.nome_evento AS nome, e.data_evento AS data, e.horario_evento AS hora, e.id_restaurante AS restaurante_id, r.nome AS restaurante FROM eventos e JOIN restaurantes r ON e.id_restaurante = r.id LIMIT ? OFFSET ?',
    [limit, offset],
    (err, rows) => {
      if (err) {
        console.error('❌ Erro ao listar eventos:', err.message);
        return next(new ApiError(500, 'Erro ao listar eventos', 'LIST_EVENTS_ERROR', err.message));
      }
      db.get('SELECT COUNT(*) as count FROM eventos', [], (err2, result) => {
        if (err2) {
          console.error('❌ Erro ao contar eventos:', err2.message);
          return next(new ApiError(500, 'Erro ao listar eventos', 'LIST_EVENTS_ERROR', err2.message));
        }
        res.json({ data: rows, total: result.count });
      });
    }
  );
});

// Get single event
router.get('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const db = getDatabase();
  db.get('SELECT e.id, e.nome_evento AS nome, e.data_evento AS data, e.horario_evento AS hora, e.id_restaurante AS restaurante_id, r.nome AS restaurante FROM eventos e JOIN restaurantes r ON e.id_restaurante = r.id WHERE e.id = ?', [req.params.id], (err, row) => {
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
  const { nome, data, hora, restauranteId } = req.body;
  if (!nome || !isValidDate(data) || !isValidTime(hora) || !isValidInt(restauranteId)) {
    return next(new ApiError(400, 'Dados inválidos para criação de evento', 'INVALID_FIELDS'));
  }
  const db = getDatabase();
  db.run(
    'INSERT INTO eventos (nome_evento, data_evento, horario_evento, id_restaurante) VALUES (?, ?, ?, ?) RETURNING id',
    [nome, data, hora, restauranteId],
    function(err) {
      if (err) {
        console.error('❌ Erro ao criar evento:', err.message);
        return next(new ApiError(500, 'Erro ao criar evento', 'CREATE_EVENT_ERROR', err.message));
      }
      res.status(201).json({ id: this.lastID, nome, data, hora, restauranteId });
    }
  );
});

// Update event
router.put('/:id', (req, res, next) => {
  if (!isValidInt(req.params.id)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const { nome, data, hora, restauranteId } = req.body;
  const fields = [];
  const values = [];
  if (nome) { fields.push('nome_evento = ?'); values.push(nome); }
  if (data) {
    if (!isValidDate(data)) return next(new ApiError(400, 'Data inválida', 'INVALID_DATE'));
    fields.push('data_evento = ?'); values.push(data);
  }
  if (hora) {
    if (!isValidTime(hora)) return next(new ApiError(400, 'Horário inválido', 'INVALID_TIME'));
    fields.push('horario_evento = ?'); values.push(hora);
  }
  if (restauranteId !== undefined) {
    if (!isValidInt(restauranteId)) return next(new ApiError(400, 'RestauranteId deve ser inteiro', 'INVALID_RESTAURANT_ID'));
    fields.push('id_restaurante = ?'); values.push(restauranteId);
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
  
// Adicionar uma reserva a um evento
router.post('/:id/reservas', async (req, res, next) => {
  try {
    const eventoId = req.params.id;
    const { reservaId } = req.body;
    if (!reservaId) {
      return next(new ApiError(400, 'reservaId é obrigatório', 'MISSING_RESERVA_ID'));
    }

    const db = getDatabase();

    const { rows: [evento] } = await db.query(
      'SELECT id, id_restaurante AS restaurante_id, data_evento FROM eventos WHERE id = ?', [eventoId]
    );
    if (!evento) {
      return next(new ApiError(404, 'Evento não encontrado', 'EVENTO_NOT_FOUND'));
    }

    const { rows: [reserva] } = await db.query(
      'SELECT id_reserva AS id, data_checkin, data_checkout, qtd_hospedes FROM reservas WHERE id_reserva = ?', [reservaId]
    );
    if (!reserva) {
      return next(new ApiError(404, 'Reserva não encontrada', 'RESERVA_NOT_FOUND'));
    }

    // Validar capacidade do restaurante
    const { rows: [restaurante] } = await db.query(
      'SELECT capacidade FROM restaurantes WHERE id = ?', [evento.restaurante_id]
    );
    if (!restaurante) {
      return next(new ApiError(404, 'Restaurante não encontrado', 'RESTAURANTE_NOT_FOUND'));
    }
    const { rows: [soma] } = await db.query(
      `SELECT COALESCE(SUM(r.qtd_hospedes),0) AS total
         FROM eventos_reservas er
         JOIN reservas r ON er.id_reserva = r.id_reserva
         WHERE er.id_evento = ?`, [eventoId]
    );
    if ((soma.total + reserva.qtd_hospedes) > restaurante.capacidade) {
      return next(new ApiError(400, 'Capacidade do restaurante excedida', 'CAPACIDADE_EXCEDIDA'));
    }

    // Verificar conflito de restaurante na mesma data
    const { rows: conflitos } = await db.query(
      `SELECT 1
         FROM eventos_reservas er
         JOIN eventos ev ON er.id_evento = ev.id
         WHERE er.id_reserva = ?
           AND ev.id_restaurante <> ?
           AND ev.data_evento BETWEEN ? AND ?
         LIMIT 1`,
      [reservaId, evento.restaurante_id, reserva.data_checkin, reserva.data_checkout]
    );
    if (conflitos.length > 0) {
      return next(new ApiError(400, 'Reserva vinculada a evento de outro restaurante na mesma data', 'RESERVA_CONFLITO'));
    }

    // Validar número máximo de eventos por duração
    const { rows: [countRes] } = await db.query(
      'SELECT COUNT(*)::int AS count FROM eventos_reservas WHERE id_reserva = ?', [reservaId]
    );
    const checkin = new Date(reserva.data_checkin);
    const checkout = new Date(reserva.data_checkout);
    const dias = Math.max(1, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
    if (countRes.count >= dias) {
      return next(new ApiError(400, 'Número máximo de eventos atingido para esta reserva', 'LIMITE_EVENTOS'));
    }

    // Inserir associação
    await db.query(
      'INSERT INTO eventos_reservas (id_evento, id_reserva) VALUES (?, ?)',
      [eventoId, reservaId]
    );
    res.status(201).json({ message: 'Reserva associada ao evento com sucesso' });
  } catch (error) {
    console.error('Erro ao associar reserva ao evento:', error);
    next(new ApiError(500, 'Erro ao associar reserva', 'ASSOCIAR_RESERVA_ERRO', error.message));
  }
});

// Remover uma reserva de um evento
router.delete('/:id/reservas/:reservaId', async (req, res, next) => {
  try {
    const { id: eventoId, reservaId } = req.params;
    const db = getDatabase();
    const result = await db.query(
      'DELETE FROM eventos_reservas WHERE id_evento = ? AND id_reserva = ?',
      [eventoId, reservaId]
    );
    if (result.rowCount === 0) {
      return next(new ApiError(404, 'Associação não encontrada', 'ASSOCIACAO_NAO_ENCONTRADA'));
    }
    res.json({ message: 'Reserva removida do evento com sucesso' });
  } catch (error) {
    console.error('Erro ao remover reserva do evento:', error);
    next(new ApiError(500, 'Erro ao remover reserva do evento', 'REMOVER_RESERVA_ERRO', error.message));
  }
});

module.exports = router;
