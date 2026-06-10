import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AuthService } from '../../core/service/auth.service';
import { ClienteService } from '../../core/service/cliente.service';
import { DialogService } from '../../core/service/dialog.service';
import { ServicoService } from '../../core/service/servicos.service';
import { Cliente } from '../../core/models/cliente.model';
import { Servico } from '../../core/models/servicos.model';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { mapClienteResponseToModel } from '../../core/mappers/cliente.mapper';
import { mapServicoResponseToModel } from '../../core/mappers/servico.mapper';

interface HorarioGrade {
  hora: string;
  disponivel: boolean;
  selecionado: boolean;
}

@Component({
  selector: 'app-novo-agendamento',
  imports: [ReactiveFormsModule, RouterModule, SelectModule, DatePickerModule, DialogModule],
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
  public readonly horariosGrade = signal<HorarioGrade[]>([]);
  
  public readonly horariosDisponiveisGrade = computed(() =>
    this.horariosGrade().filter((horario) => horario.disponivel)
  );

  public readonly carregando = signal(false);
  public readonly carregandoHorarios = signal(false);
  public readonly salvando = signal(false);
  public readonly temServicoEDataSelecionados = signal(false);
  public readonly modalHorariosAberto = signal(false);

  public readonly dataMinima = new Date();

  public readonly form = this.fb.group({
    clienteId: [null as number | null],
    servicoId: [null as number | null, [Validators.required]],
    data: [null as Date | null, [Validators.required]],
    hora: [null as string | null, [Validators.required]],
  });

  constructor() {
    if (this.authService.isManicure()) {
      this.form.controls.clienteId.addValidators(Validators.required);
      this.form.controls.clienteId.updateValueAndValidity();
    }
    this.carregarDados();
    this.form.controls.servicoId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.carregarHorariosDisponiveis());
    this.form.controls.data.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.carregarHorariosDisponiveis());
  }

  abrirModalHorarios(): void {
    if (!this.form.controls.servicoId.value || !this.form.controls.data.value) {
      this.dialogService.warn('Selecione o serviço e a data antes de escolher o horário.');
      return;
    }
    this.modalHorariosAberto.set(true);
  }

  fecharModalHorarios(): void {
    this.modalHorariosAberto.set(false);
  }

  selecionarHorario(horario: HorarioGrade): void {
    if (!horario.disponivel) {
      return;
    }
    this.form.controls.hora.setValue(horario.hora);
    this.form.controls.hora.markAsTouched();
    this.horariosGrade.update((horarios) =>
      horarios.map((item) => ({
        ...item,
        selecionado: item.hora === horario.hora,
      }))
    );
  }

  confirmarHorarioSelecionado(): void {
    if (!this.form.controls.hora.value) {
      this.dialogService.warn('Selecione um horário disponível.');
      return;
    }

    this.fecharModalHorarios();
  }

  limparHorarioSelecionado(): void {
    this.form.controls.hora.setValue(null);
    this.horariosGrade.update((horarios) =>
      horarios.map((horario) => ({
        ...horario,
        selecionado: false,
      }))
    );
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

    const clienteId = this.authService.isManicure()
      ? formValue.clienteId
      : this.authService.clienteId();

    if (!clienteId) {
      this.dialogService.warn('Cliente não encontrado para este usuário.');
      return;
    }

    const payload = {
      clienteId,
      servicoId: formValue.servicoId,
      data: this.formatarDataParaIso(formValue.data),
      hora: formValue.hora,
    };

    this.salvando.set(true);

    this.agendamentoService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogService.success('Agendamento criado com sucesso!');
        this.router.navigate(['/agendamentos']);
      },
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/agendamentos']);
  }

  obterTextoHorarioSelecionado(): string {
    return this.form.controls.hora.value ?? 'Escolher horário';
  }

  obterServicoSelecionado(): Servico | undefined {
    const servicoId = this.form.controls.servicoId.value;

    if (!servicoId) {
      return undefined;
    }

    return this.servicos().find((servico) => servico.id === servicoId);
  }

  obterDuracaoServicoSelecionado(): string {
    return this.obterServicoSelecionado()?.duracao ?? '';
  }

  horarioTemErro(): boolean {
    return this.form.controls.hora.touched && this.form.controls.hora.invalid;
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

  private carregarHorariosDisponiveis(): void {
    const formValue = this.form.getRawValue();
    this.form.controls.hora.setValue(null);
    this.horariosGrade.set([]);
    if (!formValue.servicoId || !formValue.data) {
      this.temServicoEDataSelecionados.set(false);
      return;
    }
    this.temServicoEDataSelecionados.set(true);
    const data = this.formatarDataParaIso(formValue.data);
    this.carregandoHorarios.set(true);
    this.agendamentoService.listarHorariosDisponiveis(formValue.servicoId, data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (horarios) => {
        this.horariosGrade.set(
          horarios.map((horario) => ({
            hora: this.normalizarHora(horario.hora),
            disponivel: horario.disponivel,
            selecionado: false,
          }))
        );
        this.carregandoHorarios.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregandoHorarios.set(false);
        this.horariosGrade.set([]);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  private normalizarHora(hora: string): string {
    return hora.slice(0, 5);
  }

  private converterHoraParaMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private converterDuracaoParaMinutos(duracao: string): number {
    if (!duracao) {
      return 0;
    }
    const valor = duracao.toLowerCase().trim();
    if (valor.includes('h')) {
      const partesHora = valor.split('h');
      const horasTexto = partesHora[0].replace(/\D/g, '');
      const minutosTexto = partesHora[1]?.replace(/\D/g, '') ?? '';
      const horas = horasTexto ? Number(horasTexto) : 0;
      const minutos = minutosTexto ? Number(minutosTexto) : 0;
      return horas * 60 + minutos;
    }
    const minutosTexto = valor.replace(/\D/g, '');
    return minutosTexto ? Number(minutosTexto) : 0;
  }

  obterResumoHorarioSelecionado(): string {
    const hora = this.form.controls.hora.value;
    const duracao = this.obterDuracaoServicoSelecionado();

    if (!hora || !duracao) {
      return '';
    }

    const inicio = this.converterHoraParaMinutos(hora);
    const duracaoMinutos = this.converterDuracaoParaMinutos(duracao);
    const fim = inicio + duracaoMinutos;

    return `Atendimento das ${hora} às ${this.converterMinutosParaHora(fim)}`;
  }

  private converterMinutosParaHora(totalMinutos: number): string {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  private formatarDataParaIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
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