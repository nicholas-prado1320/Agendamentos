import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../core/service/cliente.service';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';

interface AtalhoHome {
  id: 'Agenda';
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
  private readonly clienteService = inject(ClienteService);
  private readonly agendamentoService = inject(AgendamentoService);

  menuAberto = false;

  public readonly dataAtual = this.formatarDataAtual();

  public readonly atalhos: AtalhoHome[] = [
    // {
    //   id: 'Agenda',
    //   titulo: 'Agenda',
    //   icone: 'pi pi-calendar-plus',
    // }
  ];

  public readonly agendamentosHoje = computed(() => {
    const hoje = this.obterDataIsoHoje();
    const clientes = this.clienteService.clientes();
    return this.agendamentoService.agendamentos().filter((agendamento) =>
      agendamento.data === hoje).map((agendamento) => {
        const cliente = clientes.find((item) => item.id === agendamento.cliente.id);
        return {
          ...agendamento,
          clienteNome: cliente?.nomeCompleto ?? 'Cliente excluída',
          iniciais: cliente?.iniciais ?? '--',
        };
      }).sort((a, b) => a.hora.localeCompare(b.hora));
  });

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
    // if (atalho === 'Agenda') {
    //   this.router.navigate(['/agendamentos'], {
    //     queryParams: {
    //       filtro: 'Agenda',
    //     },
    //   });
    //   return;
    // }
  }

  novoAgendamento(): void {
    this.router.navigate(['novo-agendamento']);
  }

  verTodosAgendamentos(): void {
    this.router.navigate(['/agendamentos']);
  }

  private obterDataIsoHoje(): string {
    return new Date().toISOString().split('T')[0];
  }

  private formatarDataAtual(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }
}