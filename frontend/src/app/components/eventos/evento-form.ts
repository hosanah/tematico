/**
 * Formulário de Evento
 * Usado para criação e edição de eventos
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { EventoService, Evento } from '../../services/eventos';
import { extractErrorMessage } from '../../utils';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './evento-form.html',
  styleUrls: ['./evento-form.scss']
})
export class EventoFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  isLoading = false;
  private id?: number;

  constructor(
    private fb: FormBuilder,
    private service: EventoService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      data: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      hora: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.isEdit = true;
      this.service.getEvento(this.id).subscribe({
        next: data => this.form.patchValue(data)
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const value = this.form.value as Evento;
    const request = this.isEdit && this.id
      ? this.service.updateEvento(this.id, value)
      : this.service.createEvento(value);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Evento salvo' });
        this.router.navigate(['/eventos']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/eventos']);
  }

  private showError(summary: string, err: any): void {
    let detail = 'Falha na operação';
    if (err.status >= 400 && err.status < 500) {
      detail = extractErrorMessage(err);
    }
    this.messageService.add({ severity: 'error', summary, detail });
  }
}
