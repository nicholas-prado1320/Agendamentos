import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';

interface AtalhoHome {
  id: 'novo-agendamento' | 'hoje' | 'semana';
  titulo: string;
  icone: string;
}

type RotaMenu = 'home' | 'agendamentos' | 'clientes' | 'servicos';

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

  public readonly agendamentosHoje = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);

  menuAberto = false;

  public readonly dataAtual = this.formatarDataAtual();

  public readonly atalhos: AtalhoHome[] = [
    {
      id: 'novo-agendamento',
      titulo: 'Novo agendamento',
      icone: 'pi pi-calendar-plus',
    },
    {
      id: 'hoje',
      titulo: 'Hoje',
      icone: 'pi pi-clock',
    },
    {
      id: 'semana',
      titulo: 'Semana',
      icone: 'pi pi-calendar',
    },
  ];

  constructor() {
    this.carregarAgendamentosHoje();
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  navegarPara(rota: RotaMenu): void {
    this.fecharMenu();
    const rotas: Record<RotaMenu, string> = {
      home: '/home',
      agendamentos: '/agendamentos',
      clientes: '/clientes',
      servicos: '/servicos',
    };
    this.router.navigate([rotas[rota]]);
  }

  selecionarAtalho(atalho: AtalhoHome['id']): void {
    if (atalho === 'novo-agendamento') {
      this.novoAgendamento();
      return;
    }
    if (atalho === 'hoje') {
      this.router.navigate(['/agendamentos'], {
        queryParams: {
          filtro: 'hoje',
        },
      });
      return;
    }
    if (atalho === 'semana') {
      this.router.navigate(['/agendamentos'], {
        queryParams: {
          filtro: 'semana',
        },
      });
    }
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
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };
    return statusMap[status] ?? status;
  }

  private carregarAgendamentosHoje(): void {
    this.carregando.set(true);
    this.agendamentoService.listarHoje().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (agendamentos) => {
        const agendamentosMapeados = agendamentos.map(mapAgendamentoResponseToModel).sort((a, b) => a.hora.localeCompare(b.hora));
        this.agendamentosHoje.set(agendamentosMapeados);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        alert('Não foi possível carregar os agendamentos de hoje.');
      },
    });
  }

  private formatarDataAtual(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }
}