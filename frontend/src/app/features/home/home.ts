import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Router } from '@angular/router';
import { ClienteService } from '../../core/service/cliente.service';
import { AgendamentoService } from '../../core/service/agendamento.service';

interface AtalhoHome {
  id: 'novo-agendamento' | 'hoje' | 'semana';
  titulo: string;
  icone: string;
}

@Component({
  selector: 'app-home',
  imports: [DrawerModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private agendamentoService = inject(AgendamentoService);

  menuAberto = false;
  readonly dataAtual = 'Segunda-feira, 12 de maio';

  readonly atalhos: AtalhoHome[] = [
    { id: 'novo-agendamento', titulo: 'Novo agendamento', icone: 'pi pi-calendar-plus' },
    { id: 'hoje', titulo: 'Hoje', icone: 'pi pi-calendar' },
    { id: 'semana', titulo: 'Semana', icone: 'pi pi-calendar-times' },
  ];

  agendamentosHoje = computed(() => {
    const agendamentos = this.agendamentoService.agendamentos();
    const clientes = this.clienteService.clientes();

    return agendamentos.map(agendamento => {
      // Busca a cliente correspondente
      const cliente = clientes.find(c => c.id === agendamento.clienteId);

      return {
        ...agendamento,
        clienteNome: cliente?.nomeCompleto || 'Cliente excluída',
        iniciais: cliente?.iniciais || '--'
      };
    });
  });

  abrirMenu(): void {
    this.menuAberto = true;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  selecionarAtalho(atalho: AtalhoHome['id']): void {
    if (atalho === 'novo-agendamento') {
      this.router.navigate(['/agendamentos/novo']);
    } else if (atalho === 'hoje') {
      // Navegação/ação para "Hoje" será implementada posteriormente
    } else if (atalho === 'semana') {
      // Navegação/ação para "Semana" será implementada posteriormente
    }
    // Hoje e Semana implementaremos nas próximas telas
  }
}
