import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly agendamentoService = inject(AgendamentoService);

  public readonly filtroSelecionado = signal<FiltroAgendamento>('todos');
  public readonly agendamentos = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);

  menuAberto = false;

  public readonly filtros: { label: string; value: FiltroAgendamento }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Hoje', value: 'hoje' },
    { label: 'Semana', value: 'semana' },
  ];

  public readonly agendamentosFiltrados = computed(() => {
    return this.agendamentos().sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`).getTime();
      const dataHoraB = new Date(`${b.data}T${b.hora}`).getTime();
      return dataHoraA - dataHoraB;
    });
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filtro = params.get('filtro');
      if (filtro === 'hoje' || filtro === 'semana' || filtro === 'todos') {
        this.filtroSelecionado.set(filtro);
      } else {
        this.filtroSelecionado.set('todos');
      }
      this.carregarAgendamentos();
    });
  }

  concluirAgendamento(id: number): void {
    const confirmou = confirm('Deseja marcar este agendamento como concluído?');
    if (!confirmou) {
      return;
    }
    this.agendamentoService.concluir(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (agendamentoAtualizado) => {
        const agendamento = mapAgendamentoResponseToModel(agendamentoAtualizado);
        this.agendamentos.update((agendamentos) =>
          agendamentos.map((item) => (item.id === id ? agendamento : item))
        );
      },
      error: () => {
        alert('Não foi possível concluir o agendamento.');
      },
    });
  }

  cancelarAgendamento(id: number): void {
    const confirmou = confirm('Deseja cancelar este agendamento?');
    if (!confirmou) {
      return;
    }
    this.agendamentoService.cancelar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (agendamentoAtualizado) => {
        const agendamento = mapAgendamentoResponseToModel(agendamentoAtualizado);
        this.agendamentos.update((agendamentos) =>
          agendamentos.map((item) => (item.id === id ? agendamento : item))
        );
      },
      error: () => {
        alert('Não foi possível cancelar o agendamento.');
      },
    });
  }

  removerAgendamento(id: number): void {
    const confirmou = confirm('Deseja excluir este agendamento?');
    if (!confirmou) {
      return;
    }
    this.agendamentoService.remover(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.agendamentos.update((agendamentos) =>
          agendamentos.filter((agendamento) => agendamento.id !== id)
        );
      },
      error: () => {
        alert('Não foi possível excluir o agendamento.');
      },
    });
  }

  podeConcluir(status: string): boolean {
    return status === 'AGENDADO';
  }

  podeCancelar(status: string): boolean {
    return status === 'AGENDADO';
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

  formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      AGENDADO: 'Agendado',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
    };
    return statusMap[status] ?? status;
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private carregarAgendamentos(): void {
    this.carregando.set(true);
    const filtro = this.filtroSelecionado();
    const request$ = filtro === 'hoje' ? this.agendamentoService.listarHoje() : filtro === 'semana' ? this.agendamentoService.listarSemana() : this.agendamentoService.listar();
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (agendamentos) => {
        this.agendamentos.set(agendamentos.map(mapAgendamentoResponseToModel));
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        alert('Não foi possível carregar os agendamentos.');
      },
    });
  }
}