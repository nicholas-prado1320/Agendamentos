import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgendamentoService } from '../../core/service/agendamento.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { AuthService } from '../../core/service/auth.service';

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
  private readonly dialogService = inject(DialogService);

  public readonly authService = inject(AuthService);

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
    this.dialogService.confirmDialog({
      header: 'Concluir agendamento',
      message: 'Deseja marcar este agendamento como concluído?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, concluir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.agendamentoService.concluir(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (agendamentoAtualizado) => {
            const agendamento = mapAgendamentoResponseToModel(agendamentoAtualizado);
            this.agendamentos.update((agendamentos) => agendamentos.map((item) => (item.id === id ? agendamento : item)));
            this.dialogService.success('O agendamento foi concluído com sucesso.', 'Agendamento concluído');
          },
          error: () => {
            this.dialogService.error('Não foi possível concluir o agendamento.');
          },
        });
      },
    });
  }

  cancelarAgendamento(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Cancelar agendamento',
      message: 'Deseja cancelar este agendamento?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Voltar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.agendamentoService.cancelar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (agendamentoAtualizado) => {
            const agendamento = mapAgendamentoResponseToModel(agendamentoAtualizado);
            this.agendamentos.update((agendamentos) => agendamentos.map((item) => (item.id === id ? agendamento : item)));
            this.dialogService.success('O agendamento foi cancelado com sucesso.', 'Agendamento cancelado');
          },
          error: () => {
            this.dialogService.error('Não foi possível cancelar o agendamento.');
          },
        });
      },
    });
  }

  removerAgendamento(id: number): void {
    if (this.authService.isCliente()) {
      return;
    }
    this.dialogService.confirmDialog({
      header: 'Remover agendamento',
      message: 'Deseja remover este agendamento? Ele será marcado como cancelado.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.agendamentoService.remover(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.agendamentos.update((agendamentos) =>
              agendamentos.map((agendamento) =>
                agendamento.id === id
                  ? {
                    ...agendamento,
                    status: 'CANCELADO',
                  }
                  : agendamento
              )
            );
            this.dialogService.success('O agendamento foi cancelado e mantido no histórico.', 'Agendamento removido');
          },
          error: () => {
            this.dialogService.error('Não foi possível remover o agendamento.');
          },
        });
      },
    });
  }

  podeConcluir(status: string): boolean {
    return this.authService.isManicure() && status === 'AGENDADO';
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