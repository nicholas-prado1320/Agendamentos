import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';
import { AuthService } from '../../core/service/auth.service';

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

  public readonly agendamentosHoje = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);

  public menuAberto = false;

  public readonly dataAtual = this.formatarDataAtual();
  public readonly saudacao = this.obterSaudacao();
  public readonly nomeUsuario = this.obterNomeUsuario();

  constructor() {
    this.carregarAgendamentosHoje();
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
          alert('Não foi possível carregar os agendamentos de hoje.');
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
}
