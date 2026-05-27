import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { ClienteService } from '../../core/service/cliente.service';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { ServicoService } from '../../core/service/servicos.service';

@Component({
  selector: 'app-novo-agendamento',
  imports: [ReactiveFormsModule, RouterModule, SelectModule, DatePickerModule],
  templateUrl: './novo-agendamento.html',
  styleUrl: './novo-agendamento.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoAgendamento {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  private readonly clienteService = inject(ClienteService);
  private readonly servicoService = inject(ServicoService);
  private readonly agendamentoService = inject(AgendamentoService);

  public readonly clientes = this.clienteService.clientes;

  public readonly servicos = this.servicoService.servicosAtivos;

  public readonly form = this.fb.group({
    clienteId: ['', [Validators.required]],
    servicoId: ['', [Validators.required]],
    data: [null as Date | null, [Validators.required]],
    hora: [null as Date | null, [Validators.required]],
  });

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const formValue = this.form.getRawValue();
    const cliente = this.clientes().find((item) => item.id === formValue.clienteId);
    const servico = this.servicos().find((item) => item.id === formValue.servicoId);
    if (!cliente || !servico || !formValue.data || !formValue.hora) {
      this.form.markAllAsTouched();
      return;
    }
    this.agendamentoService.adicionarAgendamento({
      cliente: {
        id: cliente.id,
        nomeCompleto: cliente.nomeCompleto,
        apelido: cliente.apelido,
        iniciais: cliente.iniciais,
      },
      servico: {
        id: servico.id,
        nome: servico.nome,
        preco: servico.preco,
      },
      data: this.formatarDataParaIso(formValue.data),
      hora: this.formatarHora(formValue.hora),
    });
    this.router.navigate(['/agendamentos']);
  }

  cancelar(): void {
    this.router.navigate(['/agendamentos']);
  }

  private formatarDataParaIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private formatarHora(data: Date): string {
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${hora}:${minuto}`;
  }
}