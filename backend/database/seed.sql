-- Seed data for PostgreSQL database
INSERT INTO users (username, email, password, full_name)
VALUES ('admin', 'admin@example.com', '$2a$12$.NifCEunTbm0Q7mpJmCS3OsKigZvlwWYNSIRn6lGfasceRI965Y6u', 'Administrador')
ON CONFLICT (username) DO NOTHING;

INSERT INTO restaurantes (id, nome, capacidade, horario_funcionamento) VALUES
  (1, 'Restaurante Central', 100, '08:00-22:00'),
  (2, 'Bistrô da Praça', 50, '10:00-20:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id, nome_evento, data_evento, horario_evento, id_restaurante) VALUES
  (1, 'Noite Italiana', '2024-12-15', '19:00', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reservas (id_reserva, nome_hospede, data_checkin, data_checkout, qtd_hospedes) VALUES
  (1, 'João Silva', '2024-12-14', '2024-12-16', 2),
  (2, 'Maria Souza', '2024-12-15', '2024-12-17', 4)
ON CONFLICT (id_reserva) DO NOTHING;

INSERT INTO eventos_reservas (id_evento, id_reserva) VALUES
  (1, 1),
  (1, 2)
ON CONFLICT DO NOTHING;
