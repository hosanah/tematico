-- Schema for PostgreSQL database
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurantes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  capacidade INTEGER,
  horario_funcionamento VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS eventos (
  id SERIAL PRIMARY KEY,
  nome_evento VARCHAR(255) NOT NULL,
  data_evento DATE NOT NULL,
  horario_evento TIME NOT NULL,
  id_restaurante INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  UNIQUE (data_evento, horario_evento, id_restaurante)
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  idreservacm INTEGER NOT NULL,
  numeroreservacm VARCHAR(255) NOT NULL,
  coduh VARCHAR(255) NOT NULL,
  nome_hospede VARCHAR(255) NOT NULL,
  data_checkin DATE NOT NULL,
  data_checkout DATE NOT NULL,
  qtd_hospedes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos_reservas (
  evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  informacoes TEXT,
  quantidade INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Ativa',
  PRIMARY KEY (evento_id, reserva_id)
);
