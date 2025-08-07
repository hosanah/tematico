/**
 * Modelo de Reserva
 */
export interface Reserva {
  id?: number;
  cliente: string;
  data: string; // ISO string
  pessoas: number;
  restauranteId?: number;
  eventoId?: number;
}
