const express = require('express');
const { getDatabase } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// Adicionar uma reserva a um evento
router.post('/:id/reservas', async (req, res, next) => {
  try {
    const eventoId = req.params.id;
    const { reservaId } = req.body;
    if (!reservaId) {
      return next(new ApiError(400, 'reservaId é obrigatório', 'MISSING_RESERVA_ID'));
    }

    const db = getDatabase();

    // Obter informações do evento
    const { rows: [evento] } = await db.query(
      'SELECT id, restaurante_id, data_evento FROM eventos WHERE id = ?',[eventoId]
    );
    if (!evento) {
      return next(new ApiError(404, 'Evento não encontrado', 'EVENTO_NOT_FOUND'));
    }

    // Obter informações da reserva
    const { rows: [reserva] } = await db.query(
      'SELECT id, data_checkin, data_checkout, qtd_hospedes FROM reservas WHERE id = ?', [reservaId]
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
         JOIN reservas r ON er.reserva_id = r.id
         WHERE er.evento_id = ?`, [eventoId]
    );
    if ((soma.total + reserva.qtd_hospedes) > restaurante.capacidade) {
      return next(new ApiError(400, 'Capacidade do restaurante excedida', 'CAPACIDADE_EXCEDIDA'));
    }

    // Verificar conflito de restaurante na mesma data
    const { rows: conflitos } = await db.query(
      `SELECT 1
         FROM eventos_reservas er
         JOIN eventos ev ON er.evento_id = ev.id
         WHERE er.reserva_id = ?
           AND ev.restaurante_id <> ?
           AND ev.data_evento BETWEEN ? AND ?
         LIMIT 1`,
      [reservaId, evento.restaurante_id, reserva.data_checkin, reserva.data_checkout]
    );
    if (conflitos.length > 0) {
      return next(new ApiError(400, 'Reserva vinculada a evento de outro restaurante na mesma data', 'RESERVA_CONFLITO'));
    }

    // Validar número máximo de eventos por duração
    const { rows: [countRes] } = await db.query(
      'SELECT COUNT(*)::int AS count FROM eventos_reservas WHERE reserva_id = ?', [reservaId]
    );
    const checkin = new Date(reserva.data_checkin);
    const checkout = new Date(reserva.data_checkout);
    const dias = Math.max(1, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
    if (countRes.count >= dias) {
      return next(new ApiError(400, 'Número máximo de eventos atingido para esta reserva', 'LIMITE_EVENTOS'));
    }

    // Inserir associação
    await db.query(
      'INSERT INTO eventos_reservas (evento_id, reserva_id) VALUES (?, ?)',
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
      'DELETE FROM eventos_reservas WHERE evento_id = ? AND reserva_id = ?',
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
