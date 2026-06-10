import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServicoService } from '../../core/service/servicos.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Servico } from '../../core/models/servicos.model';
import { mapServicoResponseToModel } from '../../core/mappers/servico.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { AuthService } from '../../core/service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

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
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  excluirServico(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Excluir serviço',
      message: 'Deseja excluir definitivamente este serviço? Essa ação não poderá ser desfeita.',
      icon: 'pi pi-trash',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.servicoService.excluir(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.servicos.update((servicos) => servicos.filter((servico) => servico.id !== id));
            this.dialogService.success('Serviço excluído com sucesso.', 'Serviço excluído');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
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
      error: (error: HttpErrorResponse) => {
        this.dialogService.error(this.extrairMensagemErro(error));
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

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível realizar esta ação.';
  }
}