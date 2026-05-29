import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ClienteService } from '../../core/service/cliente.service';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { ServicoService } from '../../core/service/servicos.service';
import { Cliente } from '../../core/models/cliente.model';
import { Servico } from '../../core/models/servicos.model';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { mapClienteResponseToModel } from '../../core/mappers/cliente.mapper';
import { mapServicoResponseToModel } from '../../core/mappers/servico.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { AuthService } from '../../core/service/auth.service';
import { forkJoin, of } from 'rxjs';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogService = inject(DialogService);
  private readonly clienteService = inject(ClienteService);
  private readonly servicoService = inject(ServicoService);
  private readonly agendamentoService = inject(AgendamentoService);

  public readonly authService = inject(AuthService);

  public readonly clientes = signal<Cliente[]>([]);
  public readonly servicos = signal<Servico[]>([]);
  public readonly carregando = signal(false);
  public readonly salvando = signal(false);

  public readonly form = this.fb.group({
    clienteId: [null as number | null],
    servicoId: [null as number | null, [Validators.required]],
    data: [null as Date | null, [Validators.required]],
    hora: [null as Date | null, [Validators.required]],
  });

  constructor() {
    if (this.authService.isManicure()) {
      this.form.controls.clienteId.addValidators(Validators.required);
      this.form.controls.clienteId.updateValueAndValidity();
    }
    this.carregarDados();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (!formValue.servicoId || !formValue.data || !formValue.hora) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.authService.isManicure() && !formValue.clienteId) {
      this.form.controls.clienteId.markAsTouched();
      return;
    }

    const payload = {
      clienteId: this.authService.isManicure() && formValue.clienteId ? formValue.clienteId : undefined,
      servicoId: formValue.servicoId,
      data: this.formatarDataParaIso(formValue.data),
      hora: this.formatarHora(formValue.hora),
    };

    this.salvando.set(true);

    this.agendamentoService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogService.success('Agendamento criado com sucesso!');
        this.router.navigate(['/agendamentos']);
      },
      error: (error) => {
        this.salvando.set(false);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/agendamentos']);
  }

  private carregarDados(): void {
    this.carregando.set(true);

    const clientes$ = this.authService.isManicure() ? this.clienteService.listarAtivos() : of([]);

    forkJoin({
      clientes: clientes$,
      servicos: this.servicoService.listarAtivos(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ clientes, servicos }) => {
        this.clientes.set(clientes.map(mapClienteResponseToModel));
        this.servicos.set(servicos.map(mapServicoResponseToModel));
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.dialogService.error('Não foi possível carregar os dados do agendamento.');
      },
    });
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

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível criar o agendamento.';
  }
}