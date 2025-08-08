import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ReservaEventoService, Voucher } from '../../services/reserva-evento.service';

@Component({
  selector: 'app-reserva-voucher',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './reserva-voucher.html',
  styleUrls: ['./reserva-voucher.scss']
})
export class ReservaVoucherComponent implements OnInit {
  voucher?: Voucher;

  constructor(private route: ActivatedRoute, private service: ReservaEventoService) {}

  ngOnInit(): void {
    const reservaId = Number(this.route.snapshot.paramMap.get('reservaId'));
    const eventoId = Number(this.route.snapshot.paramMap.get('eventoId'));
    if (reservaId && eventoId) {
      this.service.getVoucher(reservaId, eventoId).subscribe(v => (this.voucher = v));
    }
  }

  imprimir(): void {
    window.print();
  }
}
