const express = require('express');
const { ApiError } = require('../middleware/errorHandler');
const model = require('../models/eventoReservaModel');

const router = express.Router();

function isValidInt(value) {
  return Number.isInteger(Number(value));
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await model.findAll();
    res.json(rows);
  } catch (err) {
    console.error('❌ Erro ao listar marcações:', err.message);
    next(new ApiError(500, 'Erro ao listar marcações', 'LIST_MARCACOES_ERROR', err.message));
  }
});

router.get('/:eventoId/:reservaId', async (req, res, next) => {
  const { eventoId, reservaId } = req.params;
  if (!isValidInt(eventoId) || !isValidInt(reservaId)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  try {
    const row = await model.findById(eventoId, reservaId);
    if (!row) {
      return next(new ApiError(404, 'Marcação não encontrada', 'MARCACAO_NOT_FOUND'));
    }
    res.json(row);
  } catch (err) {
    console.error('❌ Erro ao obter marcação:', err.message);
    next(new ApiError(500, 'Erro ao obter marcação', 'GET_MARCACAO_ERROR', err.message));
  }
});

router.post('/', async (req, res, next) => {
  const { eventoId, reservaId, informacoes, quantidade, status } = req.body;
  if (!isValidInt(eventoId) || !isValidInt(reservaId) || !isValidInt(quantidade)) {
    return next(new ApiError(400, 'Dados inválidos', 'INVALID_FIELDS'));
  }
  try {
    const created = await model.create({ eventoId, reservaId, informacoes, quantidade, status });
    res.status(201).json(created);
  } catch (err) {
    console.error('❌ Erro ao criar marcação:', err.message);
    next(new ApiError(500, 'Erro ao criar marcação', 'CREATE_MARCACAO_ERROR', err.message));
  }
});

router.put('/:eventoId/:reservaId', async (req, res, next) => {
  const { eventoId, reservaId } = req.params;
  if (!isValidInt(eventoId) || !isValidInt(reservaId)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  const { informacoes, quantidade, status } = req.body;
  if (
    informacoes === undefined &&
    quantidade === undefined &&
    status === undefined
  ) {
    return next(new ApiError(400, 'Nenhum dado para atualizar', 'NO_FIELDS_TO_UPDATE'));
  }
  if (quantidade !== undefined && !isValidInt(quantidade)) {
    return next(new ApiError(400, 'quantidade inválida', 'INVALID_QUANTIDADE'));
  }
  try {
    const updated = await model.update(eventoId, reservaId, { informacoes, quantidade, status });
    if (updated === 0) {
      return next(new ApiError(404, 'Marcação não encontrada', 'MARCACAO_NOT_FOUND'));
    }
    res.json({ message: 'Marcação atualizada com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao atualizar marcação:', err.message);
    next(new ApiError(500, 'Erro ao atualizar marcação', 'UPDATE_MARCACAO_ERROR', err.message));
  }
});

router.delete('/:eventoId/:reservaId', async (req, res, next) => {
  const { eventoId, reservaId } = req.params;
  if (!isValidInt(eventoId) || !isValidInt(reservaId)) {
    return next(new ApiError(400, 'ID inválido', 'INVALID_ID'));
  }
  try {
    const removed = await model.remove(eventoId, reservaId);
    if (removed === 0) {
      return next(new ApiError(404, 'Marcação não encontrada', 'MARCACAO_NOT_FOUND'));
    }
    res.json({ message: 'Marcação removida com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao remover marcação:', err.message);
    next(new ApiError(500, 'Erro ao remover marcação', 'DELETE_MARCACAO_ERROR', err.message));
  }
});

module.exports = router;
