import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServicoService } from '../../core/service/servicos.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Servico } from '../../core/models/servicos.model';
import { mapServicoResponseToModel } from '../../core/mappers/servico.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { AuthService } from '../../core/service/auth.service';

type FiltroServico = 'ativos' | 'inativos' | 'todos';

@Component({
  selector: 'app-servicos',
  imports: [RouterModule, AppDrawerComponent],
  templateUrl: './servicos.html',
  styleUrl: './servicos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Servicos {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly servicoService = inject(ServicoService);
  private readonly dialogService = inject(DialogService);

  public readonly filtroSelecionado = signal<FiltroServico>('ativos');
  public readonly servicos = signal<Servico[]>([]);
  public readonly carregando = signal(false);

  public readonly authService = inject(AuthService);

  public readonly filtros: { label: string; value: FiltroServico }[] = [
    { label: 'Ativos', value: 'ativos' },
    { label: 'Inativos', value: 'inativos' },
    { label: 'Todos', value: 'todos' },
  ];

  menuAberto = false;

  public readonly servicosFiltrados = computed(() => {
    const servicos = this.servicos();
    if (this.authService.isCliente()) {
      return servicos.filter((servico) => servico.ativo);
    }
    const filtro = this.filtroSelecionado();
    if (filtro === 'ativos') {
      return servicos.filter((servico) => servico.ativo);
    }
    if (filtro === 'inativos') {
      return servicos.filter((servico) => !servico.ativo);
    }
    return servicos;
  });

  constructor() {
    this.carregarServicos();
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  novoServico(): void {
    this.router.navigate(['/novo-servico']);
  }

  alterarFiltro(filtro: FiltroServico): void {
    this.filtroSelecionado.set(filtro);
  }

  editarServico(id: number): void {
    this.router.navigate(['/novo-servico'], {
      queryParams: {
        id,
      },
    });
  }

  inativarServico(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Inativar serviço',
      message: 'Deseja inativar este serviço?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.servicoService.inativar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (servicoAtualizado) => {
            const servico = mapServicoResponseToModel(servicoAtualizado);
            this.servicos.update((servicos) => servicos.map((item) => (item.id === id ? servico : item)));
            this.dialogService.success('O serviço foi inativado com sucesso.', 'Serviço inativado');
          },
          error: () => {
            this.dialogService.error('Não foi possível inativar o serviço.');
          },
        });
      },
    });
  }

  ativarServico(id: number): void {
    this.servicoService.ativar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servicoAtualizado) => {
        const servico = mapServicoResponseToModel(servicoAtualizado);
        this.servicos.update((servicos) => servicos.map((item) => (item.id === id ? servico : item)));
        this.dialogService.success('O serviço foi ativado com sucesso.', 'Serviço ativado');
      },
      error: () => {
        this.dialogService.error('Não foi possível ativar o serviço.');
      },
    });
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private carregarServicos(): void {
    this.carregando.set(true);
    this.servicoService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servicos) => {
        this.servicos.set(servicos.map(mapServicoResponseToModel));
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        alert('Não foi possível carregar os serviços.');
      },
    });
  }
}