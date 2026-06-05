import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-home',
  imports: [AppDrawerComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  private readonly relogio = signal(new Date());

  public readonly agendamentosHoje = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);
  public readonly processandoAgendamentoId = signal<number | null>(null);

  public menuAberto = false;

  public readonly dataAtual = this.formatarDataAtual();
  public readonly saudacao = this.obterSaudacao();
  public readonly nomeUsuario = this.obterNomeUsuario();

  constructor() {
    this.carregarAgendamentosHoje();

    const intervaloRelogio = window.setInterval(() => {
      this.relogio.set(new Date());
    }, 30_000);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervaloRelogio);
    });
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  novoAgendamento(): void {
    this.router.navigate(['/novo-agendamento']);
  }

  verTodosAgendamentos(): void {
    this.router.navigate(['/agendamentos']);
  }

  podeIniciar(agendamento: Agendamento): boolean {
    if (!this.authService.isManicure()) {
      return false;
    }

    if (agendamento.status !== 'AGENDADO') {
      return false;
    }

    const agora = this.relogio();
    const horarioAgendamento = this.converterHoraParaDataHoje(agendamento.hora);

    return horarioAgendamento.getTime() <= agora.getTime();
  }

  podeConcluir(agendamento: Agendamento): boolean {
    if (!this.authService.isManicure()) {
      return false;
    }

    return agendamento.status === 'EM_ATENDIMENTO';
  }

  iniciarAtendimento(agendamento: Agendamento): void {
    if (!this.podeIniciar(agendamento)) {
      return;
    }

    this.processandoAgendamentoId.set(agendamento.id);

    this.agendamentoService
      .iniciar(agendamento.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.processandoAgendamentoId.set(null);
          this.dialogService.success('Atendimento iniciado com sucesso!');
          this.carregarAgendamentosHoje();
        },
        error: (error: HttpErrorResponse) => {
          this.processandoAgendamentoId.set(null);
          this.dialogService.error(this.extrairMensagemErro(error));
        },
      });
  }

  concluirAtendimento(agendamento: Agendamento): void {
    if (!this.podeConcluir(agendamento)) {
      return;
    }

    this.processandoAgendamentoId.set(agendamento.id);

    this.agendamentoService
      .concluir(agendamento.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.processandoAgendamentoId.set(null);
          this.dialogService.success('Atendimento concluído com sucesso!');
          this.carregarAgendamentosHoje();
        },
        error: (error: HttpErrorResponse) => {
          this.processandoAgendamentoId.set(null);
          this.dialogService.error(this.extrairMensagemErro(error));
        },
      });
  }

  formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      AGENDADO: 'Agendado',
      EM_ATENDIMENTO: 'Em atendimento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      EXCLUIDO: 'Excluído',
    };

    return statusMap[status] ?? status;
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  private carregarAgendamentosHoje(): void {
    this.carregando.set(true);

    this.agendamentoService
      .listarHoje()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (agendamentos) => {
          const agendamentosMapeados = agendamentos
            .map(mapAgendamentoResponseToModel)
            .sort((a, b) => a.hora.localeCompare(b.hora));

          this.agendamentosHoje.set(agendamentosMapeados);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.dialogService.error('Não foi possível carregar os agendamentos de hoje.');
        },
      });
  }

  private converterHoraParaDataHoje(hora: string): Date {
    const [horas, minutos] = hora.slice(0, 5).split(':').map(Number);

    const data = new Date();
    data.setHours(horas, minutos, 0, 0);

    return data;
  }

  private obterSaudacao(): string {
    const horaAtual = new Date().getHours();

    if (horaAtual >= 5 && horaAtual <= 11) {
      return 'Bom dia';
    }

    if (horaAtual >= 12 && horaAtual <= 17) {
      return 'Boa tarde';
    }

    return 'Boa noite';
  }

  private obterNomeUsuario(): string {
    const usuario = this.authService.usuarioLogado();

    if (!usuario?.nome) {
      return 'Nails';
    }

    return usuario.nome.split(' ')[0];
  }

  private formatarDataAtual(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;

    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }

    if (apiError?.message) {
      return apiError.message;
    }

    return 'Não foi possível concluir a operação.';
  }
}