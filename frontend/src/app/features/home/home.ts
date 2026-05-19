import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';

interface AtalhoHome {
  id: 'novo-agendamento' | 'hoje' | 'semana';
  titulo: string;
  icone: string;
}

interface AgendamentoHome {
  id: number;
  hora: string;
  cliente: string;
  iniciais: string;
  servico: string;
  status: string;
}

@Component({
  selector: 'app-home',
  imports: [DrawerModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  menuAberto = false;

  readonly dataAtual = 'Segunda-feira, 12 de maio';

  readonly atalhos: AtalhoHome[] = [
    {
      id: 'novo-agendamento',
      titulo: 'Novo agendamento',
      icone: 'pi pi-calendar-plus',
    },
    {
      id: 'hoje',
      titulo: 'Hoje',
      icone: 'pi pi-calendar',
    },
    {
      id: 'semana',
      titulo: 'Semana',
      icone: 'pi pi-calendar-times',
    },
  ];

  readonly agendamentosHoje: AgendamentoHome[] = [
    {
      id: 1,
      hora: '09:00',
      cliente: 'Maria Eduarda',
      iniciais: 'MA',
      servico: 'Esmaltação em gel',
      status: 'Agendado',
    },
    {
      id: 2,
      hora: '10:30',
      cliente: 'Ana Clara',
      iniciais: 'AC',
      servico: 'Manicure + Alongamento',
      status: 'Agendado',
    },
    {
      id: 3,
      hora: '14:00',
      cliente: 'Vitória',
      iniciais: 'VT',
      servico: 'Manicure tradicional',
      status: 'Agendado',
    },
  ];

  abrirMenu(): void {
    this.menuAberto = true;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  selecionarAtalho(atalho: AtalhoHome['id']): void {
    console.log('Atalho selecionado:', atalho);
  }
}
