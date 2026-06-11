import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { DialogService } from '../../core/service/dialog.service';
import { HorarioAtendimentoService } from '../../core/service/horario-atendimento.service';
import { BloqueioAgendaService } from '../../core/service/bloqueio-agenda.service';
import { DiaSemana, HorarioAtendimentoRequest, HorarioAtendimentoResponse } from '../../core/models/dtos/horario-atendimento.dto';
import { BloqueioAgendaRequest, BloqueioAgendaResponse } from '../../core/models/dtos/bloqueio-agenda.dto';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

interface HorarioDiaView {
  diaSemana: DiaSemana;
  label: string;
  ativo: boolean;
  atendimento24h: boolean;
  horaInicio: Date | null;
  horaFim: Date | null;
}

interface BloqueioAgendaForm {
  motivo: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  diaInteiro: boolean;
  horaInicio: Date | null;
  horaFim: Date | null;
}

@Component({
  selector: 'app-horarios',
  imports: [
    RouterModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    FloatLabelModule,
    InputTextModule,
    TextareaModule,
    AppDrawerComponent,
  ],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Horarios {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogService = inject(DialogService);
  private readonly horarioAtendimentoService = inject(HorarioAtendimentoService);
  private readonly bloqueioAgendaService = inject(BloqueioAgendaService);

  public readonly carregando = signal(false);
  public readonly salvando = signal(false);
  public readonly salvandoBloqueio = signal(false);
  public readonly bloqueios = signal<BloqueioAgendaResponse[]>([]);

  public menuAberto = false;

  public readonly bloqueioForm = signal<BloqueioAgendaForm>({
    motivo: '',
    dataInicio: null,
    dataFim: null,
    diaInteiro: true,
    horaInicio: this.criarHora('08:00'),
    horaFim: this.criarHora('18:00'),
  });

  public readonly horarios = signal<HorarioDiaView[]>([
    {
      diaSemana: 'MONDAY',
      label: 'Segunda-feira',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'TUESDAY',
      label: 'Terça-feira',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'WEDNESDAY',
      label: 'Quarta-feira',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'THURSDAY',
      label: 'Quinta-feira',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'FRIDAY',
      label: 'Sexta-feira',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'SATURDAY',
      label: 'Sábado',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'SUNDAY',
      label: 'Domingo',
      ativo: false,
      atendimento24h: false,
      horaInicio: null,
      horaFim: null,
    },
  ]);

  constructor() {
    this.carregarHorarios();
    this.carregarBloqueios();
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  alterarAtivo(index: number, ativo: boolean): void {
    this.horarios.update((horarios) =>
      horarios.map((horario, i) => {
        if (i !== index) {
          return horario;
        }

        return {
          ...horario,
          ativo,
          atendimento24h: ativo ? horario.atendimento24h : false,
          horaInicio: ativo ? horario.horaInicio ?? this.criarHora('08:00') : null,
          horaFim: ativo ? horario.horaFim ?? this.criarHora('18:00') : null,
        };
      })
    );
  }

  alterarAtendimento24h(index: number, atendimento24h: boolean): void {
    this.horarios.update((horarios) =>
      horarios.map((horario, i) => {
        if (i !== index) {
          return horario;
        }

        return {
          ...horario,
          ativo: atendimento24h ? true : horario.ativo,
          atendimento24h,
          horaInicio: atendimento24h ? this.criarHora('00:00') : horario.horaInicio ?? this.criarHora('08:00'),
          horaFim: atendimento24h ? this.criarHora('23:59') : horario.horaFim ?? this.criarHora('18:00'),
        };
      })
    );
  }

  atualizarHoraInicio(index: number, valor: Date | null): void {
    this.horarios.update((horarios) =>
      horarios.map((horario, i) => (i === index ? { ...horario, horaInicio: valor } : horario))
    );
  }

  atualizarHoraFim(index: number, valor: Date | null): void {
    this.horarios.update((horarios) =>
      horarios.map((horario, i) => (i === index ? { ...horario, horaFim: valor } : horario))
    );
  }

  atualizarBloqueioMotivo(valor: string): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      motivo: valor,
    }));
  }

  atualizarBloqueioDataInicio(valor: Date | null): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      dataInicio: valor,
      dataFim: form.dataFim ?? valor,
    }));
  }

  atualizarBloqueioDataFim(valor: Date | null): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      dataFim: valor,
    }));
  }

  atualizarBloqueioDiaInteiro(valor: boolean): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      diaInteiro: valor,
    }));
  }

  atualizarBloqueioHoraInicio(valor: Date | null): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      horaInicio: valor,
    }));
  }

  atualizarBloqueioHoraFim(valor: Date | null): void {
    this.bloqueioForm.update((form) => ({
      ...form,
      horaFim: valor,
    }));
  }

  salvar(): void {
    const horarios = this.horarios();
    const erro = this.validarHorarios(horarios);

    if (erro) {
      this.dialogService.error(erro);
      return;
    }

    const payload: HorarioAtendimentoRequest[] = horarios.map((horario) => ({
      diaSemana: horario.diaSemana,
      ativo: horario.ativo,
      atendimento24h: horario.atendimento24h,
      horaInicio: horario.ativo ? this.formatarHora(horario.horaInicio) : null,
      horaFim: horario.ativo ? this.formatarHora(horario.horaFim) : null,
    }));

    this.salvando.set(true);

    this.horarioAtendimentoService.salvarTodos(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogService.success('Horários de atendimento salvos com sucesso.');
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  criarBloqueio(): void {
    const form = this.bloqueioForm();
    const erro = this.validarBloqueio(form);

    if (erro) {
      this.dialogService.error(erro);
      return;
    }

    const payload: BloqueioAgendaRequest = {
      motivo: form.motivo.trim(),
      dataInicio: this.formatarDataParaApi(form.dataInicio)!,
      dataFim: this.formatarDataParaApi(form.dataFim ?? form.dataInicio) ?? null,
      diaInteiro: form.diaInteiro,
      horaInicio: form.diaInteiro ? null : this.formatarHora(form.horaInicio),
      horaFim: form.diaInteiro ? null : this.formatarHora(form.horaFim),
    };

    this.salvandoBloqueio.set(true);

    this.bloqueioAgendaService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvandoBloqueio.set(false);
        this.dialogService.success('Bloqueio de agenda criado com sucesso.');
        this.limparFormularioBloqueio();
        this.carregarBloqueios();
      },
      error: (error: HttpErrorResponse) => {
        this.salvandoBloqueio.set(false);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  excluirBloqueio(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Excluir bloqueio',
      message: 'Deseja remover este bloqueio da agenda?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.bloqueioAgendaService.excluir(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.dialogService.success('Bloqueio removido com sucesso.');
            this.carregarBloqueios();
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  formatarPeriodoBloqueio(bloqueio: BloqueioAgendaResponse): string {
    const dataInicio = this.formatarDataExibicao(bloqueio.dataInicio);
    const dataFim = this.formatarDataExibicao(bloqueio.dataFim);

    if (bloqueio.dataInicio === bloqueio.dataFim) {
      return dataInicio;
    }

    return `${dataInicio} até ${dataFim}`;
  }

  formatarHorarioBloqueio(bloqueio: BloqueioAgendaResponse): string {
    if (bloqueio.diaInteiro) {
      return 'Dia inteiro';
    }

    return `${this.formatarHoraExibicao(bloqueio.horaInicio)} às ${this.formatarHoraExibicao(bloqueio.horaFim)}`;
  }

  private carregarHorarios(): void {
    this.carregando.set(true);
    this.horarioAtendimentoService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.length > 0) {
          this.aplicarHorariosSalvos(response);
        }
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.dialogService.error('Não foi possível carregar os horários de atendimento.');
      },
    });
  }

  private carregarBloqueios(): void {
    this.bloqueioAgendaService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (bloqueios) => {
        this.bloqueios.set(bloqueios);
      },
      error: () => {
        this.bloqueios.set([]);
      },
    });
  }

  private aplicarHorariosSalvos(response: HorarioAtendimentoResponse[]): void {
    this.horarios.update((horariosPadrao) =>
      horariosPadrao.map((horarioPadrao) => {
        const horarioSalvo = response.find((item) => item.diaSemana === horarioPadrao.diaSemana);
        if (!horarioSalvo) {
          return horarioPadrao;
        }
        return {
          ...horarioPadrao,
          ativo: horarioSalvo.ativo,
          atendimento24h: horarioSalvo.atendimento24h,
          horaInicio: horarioSalvo.ativo && horarioSalvo.horaInicio ? this.criarHora(horarioSalvo.horaInicio) : null,
          horaFim: horarioSalvo.ativo && horarioSalvo.horaFim ? this.criarHora(horarioSalvo.horaFim) : null,
        };
      })
    );
  }

  private validarHorarios(horarios: HorarioDiaView[]): string | null {
    const temDiaAtivo = horarios.some((horario) => horario.ativo);
    if (!temDiaAtivo) {
      return 'Cadastre pelo menos um dia de atendimento ativo.';
    }
    for (const horario of horarios) {
      if (!horario.ativo) {
        continue;
      }
      if (horario.atendimento24h) {
        continue;
      }
      if (!horario.horaInicio || !horario.horaFim) {
        return `Informe hora de início e fim para ${horario.label}.`;
      }
      if (horario.horaInicio >= horario.horaFim) {
        return `A hora inicial deve ser menor que a hora final em ${horario.label}.`;
      }
    }

    return null;
  }

  private validarBloqueio(form: BloqueioAgendaForm): string | null {
    if (!form.motivo.trim()) {
      return 'Informe o motivo do bloqueio.';
    }
    if (!form.dataInicio) {
      return 'Informe a data inicial do bloqueio.';
    }
    const dataFim = form.dataFim ?? form.dataInicio;
    if (dataFim < form.dataInicio) {
      return 'A data final não pode ser anterior à data inicial.';
    }
    if (!form.diaInteiro) {
      if (!form.horaInicio || !form.horaFim) {
        return 'Informe hora de início e fim para bloqueio parcial.';
      }
      if (form.horaInicio >= form.horaFim) {
        return 'A hora inicial do bloqueio deve ser menor que a hora final.';
      }
    }
    return null;
  }

  private limparFormularioBloqueio(): void {
    this.bloqueioForm.set({
      motivo: '',
      dataInicio: null,
      dataFim: null,
      diaInteiro: true,
      horaInicio: this.criarHora('08:00'),
      horaFim: this.criarHora('18:00'),
    });
  }

  private criarHora(hora: string): Date {
    const [horas, minutos] = hora.split(':').map(Number);
    const data = new Date();
    data.setHours(horas, minutos, 0, 0);
    return data;
  }

  private formatarHora(data: Date | null): string | null {
    if (!data) {
      return null;
    }
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  private formatarDataParaApi(data: Date | null): string | null {
    if (!data) {
      return null;
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private formatarDataExibicao(data: string): string {
    if (!data) {
      return '';
    }
    const partes = data.split('-');
    if (partes.length !== 3) {
      return data;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private formatarHoraExibicao(hora: string | null): string {
    if (!hora) {
      return '';
    }
    return hora.slice(0, 5);
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível realizar esta ação.';
  }
}