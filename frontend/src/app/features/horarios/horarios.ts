import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';

import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { DialogService } from '../../core/service/dialog.service';
import { HorarioAtendimentoService } from '../../core/service/horario-atendimento.service';
import {
  DiaSemana,
  HorarioAtendimentoRequest,
  HorarioAtendimentoResponse,
} from '../../core/models/dtos/horario-atendimento.dto';

interface HorarioDiaView {
  diaSemana: DiaSemana;
  label: string;
  ativo: boolean;
  horaInicio: Date | null;
  horaFim: Date | null;
}

@Component({
  selector: 'app-horarios',
  imports: [RouterModule, FormsModule, CheckboxModule, DatePickerModule, AppDrawerComponent],
  templateUrl: './horarios.html',
  styleUrl: './horarios.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Horarios {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogService = inject(DialogService);
  private readonly horarioAtendimentoService = inject(HorarioAtendimentoService);

  public readonly carregando = signal(false);
  public readonly salvando = signal(false);

  public menuAberto = false;

  public readonly horarios = signal<HorarioDiaView[]>([
    {
      diaSemana: 'MONDAY',
      label: 'Segunda-feira',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'TUESDAY',
      label: 'Terça-feira',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'WEDNESDAY',
      label: 'Quarta-feira',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'THURSDAY',
      label: 'Quinta-feira',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'FRIDAY',
      label: 'Sexta-feira',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'SATURDAY',
      label: 'Sábado',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
    {
      diaSemana: 'SUNDAY',
      label: 'Domingo',
      ativo: false,
      horaInicio: null,
      horaFim: null,
    },
  ]);

  constructor() {
    this.carregarHorarios();
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
          horaInicio: ativo ? horario.horaInicio ?? this.criarHora('08:00') : null,
          horaFim: ativo ? horario.horaFim ?? this.criarHora('18:00') : null,
        };
      })
    );
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
      error: () => {
        this.salvando.set(false);
        this.dialogService.error('Não foi possível salvar os horários de atendimento.');
      },
    });
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

      if (!horario.horaInicio || !horario.horaFim) {
        return `Informe hora de início e fim para ${horario.label}.`;
      }

      if (horario.horaInicio >= horario.horaFim) {
        return `A hora inicial deve ser menor que a hora final em ${horario.label}.`;
      }
    }
    return null;
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
}