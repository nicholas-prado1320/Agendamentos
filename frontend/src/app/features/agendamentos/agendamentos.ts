import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';

type FiltroAgendamento = 'todos' | 'hoje' | 'semana';

@Component({
  selector: 'app-agendamentos',
  imports: [RouterModule, AppDrawerComponent],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Agendamentos {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly agendamentoService = inject(AgendamentoService);

  public readonly filtroSelecionado = signal<FiltroAgendamento>('todos');

  menuAberto = false;

  public readonly filtros: { label: string; value: FiltroAgendamento }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Hoje', value: 'hoje' },
    { label: 'Semana', value: 'semana' },
  ];

  public readonly agendamentosFiltrados = computed(() => {
    const filtro = this.filtroSelecionado();
    return this.agendamentoService.agendamentos().filter((agendamento) => {
      if (filtro === 'hoje') {
        return this.ehHoje(agendamento.data);
      }
      if (filtro === 'semana') {
        return this.estaNaSemanaAtual(agendamento.data);
      }
      return true;
    }).sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`).getTime();
      const dataHoraB = new Date(`${b.data}T${b.hora}`).getTime();
      return dataHoraA - dataHoraB;
    });
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const filtro = params.get('filtro');
      if (filtro === 'hoje' || filtro === 'semana' || filtro === 'todos') {
        this.filtroSelecionado.set(filtro);
        return;
      }
      this.filtroSelecionado.set('todos');
    });
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  alterarFiltro(filtro: FiltroAgendamento): void {
    this.filtroSelecionado.set(filtro);
    if (filtro === 'todos') {
      this.router.navigate(['/agendamentos']);
      return;
    }
    this.router.navigate(['/agendamentos'], {
      queryParams: {
        filtro,
      },
    });
  }

  novoAgendamento(): void {
    this.router.navigate(['/novo-agendamento']);
  }

  formatarData(dataIso: string): string {
    if (!dataIso) {
      return '';
    }
    const partes = dataIso.split('-');
    if (partes.length !== 3) {
      return dataIso;
    }
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private ehHoje(dataIso: string): boolean {
    const hoje = new Date().toISOString().split('T')[0];
    return dataIso === hoje;
  }

  private estaNaSemanaAtual(dataIso: string): boolean {
    const data = new Date(`${dataIso}T00:00:00`);
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    return data >= inicioSemana && data <= fimSemana;
  }
}