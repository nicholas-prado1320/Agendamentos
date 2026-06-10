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
  private readonly dialogService = inject(DialogService);

  private readonly relogio = signal(new Date());

  public readonly authService = inject(AuthService);

  public readonly agendamentosHoje = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);
  public readonly processandoAgendamentoId = signal<number | null>(null);
  public readonly quantidadePendencias = signal(0);

  public menuAberto = false;

  public readonly dataAtual = this.formatarDataAtual();
  public readonly saudacao = this.obterSaudacao();
  public readonly nomeUsuario = this.obterNomeUsuario();

  constructor() {
    this.carregarAgendamentosHoje();
    this.carregarPendencias();

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

  verPendencias(): void {
    this.router.navigate(['/agendamentos'], {
      queryParams: {
        filtro: 'pendencias',
      },
    });
  }

  podeIniciar(agendamento: Agendamento): boolean {
    if (!this.authService.isManicure()) {
      return false;
    }

    if (agendamento.status !== 'AGENDADO') {
      return false;
    }

    return this.agendamentoJaPodeIniciar(agendamento) && !this.agendamentoPassouDoFimPrevisto(agendamento);
  }

  podeConcluir(agendamento: Agendamento): boolean {
    if (!this.authService.isManicure()) {
      return false;
    }

    return agendamento.status === 'EM_ATENDIMENTO'
      || (agendamento.status === 'AGENDADO' && this.agendamentoPassouDoFimPrevisto(agendamento));
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
          this.carregarPendencias();
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
          this.carregarPendencias();
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

  private agendamentoJaPodeIniciar(agendamento: Agendamento): boolean {
    const inicio = new Date(`${agendamento.data}T${agendamento.hora}`);
    return this.relogio().getTime() >= inicio.getTime();
  }

  private agendamentoPassouDoFimPrevisto(agendamento: Agendamento): boolean {
    const duracao = agendamento.servico.duracao;
    if (!duracao) {
      return false;
    }
    const inicio = new Date(`${agendamento.data}T${agendamento.hora}`);
    const fim = new Date(inicio.getTime() + this.converterDuracaoParaMinutos(duracao) * 60_000);
    return this.relogio().getTime() > fim.getTime();
  }

  private converterDuracaoParaMinutos(duracao: string): number {
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

  private carregarPendencias(): void {
    if (!this.authService.isManicure()) {
      this.quantidadePendencias.set(0);
      return;
    }

    this.agendamentoService
      .listarPendencias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pendencias) => {
          this.quantidadePendencias.set(pendencias.length);
        },
        error: () => {
          this.quantidadePendencias.set(0);
        },
      });
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