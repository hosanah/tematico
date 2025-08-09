const { getDatabase } = require('../config/database');

async function findAll() {
  const db = getDatabase();
  const { rows } = await db.query(
    'SELECT evento_id, reserva_id, informacoes, quantidade, status FROM eventos_reservas'
  );
  return rows;
}

async function findById(eventoId, reservaId) {
  const db = getDatabase();
  const { rows: [row] } = await db.query(
    'SELECT evento_id, reserva_id, informacoes, quantidade, status FROM eventos_reservas WHERE evento_id = ? AND reserva_id = ?',
    [eventoId, reservaId]
  );
  return row;
}

async function create({ eventoId, reservaId, informacoes, quantidade, status }) {
  const db = getDatabase();
  await db.query(
    'INSERT INTO eventos_reservas (evento_id, reserva_id, informacoes, quantidade, status) VALUES (?, ?, ?, ?, ?)',
    [eventoId, reservaId, informacoes || null, quantidade, status || 'Ativa']
  );
  return { evento_id: eventoId, reserva_id: reservaId, informacoes: informacoes || null, quantidade, status: status || 'Ativa' };
}

async function update(eventoId, reservaId, { informacoes, quantidade, status }) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  if (informacoes !== undefined) {
    fields.push('informacoes = ?');
    values.push(informacoes);
  }
  if (quantidade !== undefined) {
    fields.push('quantidade = ?');
    values.push(quantidade);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }

  if (fields.length === 0) {
    return 0;
  }

  values.push(eventoId, reservaId);
  const sql = `UPDATE eventos_reservas SET ${fields.join(', ')} WHERE evento_id = ? AND reserva_id = ?`;
  const result = await db.query(sql, values);
  return result.rowCount;
}

async function remove(eventoId, reservaId) {
  const db = getDatabase();
  const result = await db.query(
    'DELETE FROM eventos_reservas WHERE evento_id = ? AND reserva_id = ?',
    [eventoId, reservaId]
  );
  return result.rowCount;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
