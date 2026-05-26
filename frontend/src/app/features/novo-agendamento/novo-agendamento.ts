import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../core/service/cliente.service';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-novo-agendamento',
  imports: [ReactiveFormsModule, RouterModule, SelectModule, DatePickerModule],
  templateUrl: './novo-agendamento.html',
  styleUrl: './novo-agendamento.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoAgendamento {
  private fb = inject(NonNullableFormBuilder);
  private clienteService = inject(ClienteService);
  private agendamentoService = inject(AgendamentoService);
  private router = inject(Router);

  readonly clientes = this.clienteService.clientes;

  form = this.fb.group({
    clienteId: ['', [Validators.required]],
    data: [null as Date | null, [Validators.required]],
    hora: [null as Date | null, [Validators.required]],
    servico: ['', [Validators.required]]
  });

  readonly servicosDisponiveis = [
    'Manicure tradicional',
    'Pedicure tradicional',
    'Esmaltação em gel',
    'Manicure + Alongamento',
    'Manutenção de alongamento',
    'Spa dos pés'
  ];

  salvar(): void {
    if (this.form.valid) {
      const formValue = this.form.getRawValue();
      const dataObj = formValue.data as Date;
      const horaObj = formValue.hora as Date;
      const agendamentoParaSalvar = {
        clienteId: formValue.clienteId,
        servico: formValue.servico,
        data: dataObj.toISOString().split('T')[0],
        hora: horaObj.toTimeString().substring(0, 5)
      };
      this.agendamentoService.adicionarAgendamento(agendamentoParaSalvar);
      this.router.navigate(['/home']);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.router.navigate(['/home']);
  }
}
