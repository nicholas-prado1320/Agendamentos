import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ClienteService } from '../../core/service/cliente.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Cliente } from '../../core/models/cliente.model';
import { mapClienteResponseToModel } from '../../core/mappers/cliente.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

type FiltroCliente = 'ATIVOS' | 'INATIVOS' | 'TODOS';

@Component({
  selector: 'app-clientes',
  imports: [RouterModule, FormsModule, AppDrawerComponent],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clienteService = inject(ClienteService);
  private readonly dialogService = inject(DialogService);

  public readonly termoBusca = signal('');
  public readonly filtroCliente = signal<FiltroCliente>('ATIVOS');
  public readonly clientes = signal<Cliente[]>([]);
  public readonly carregando = signal(false);

  menuAberto = false;

  public readonly totalAtivos = computed(() =>
    this.clientes().filter((cliente) => cliente.ativo).length
  );

  public readonly totalInativos = computed(() =>
    this.clientes().filter((cliente) => !cliente.ativo).length
  );

  public readonly clientesFiltrados = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    const filtro = this.filtroCliente();

    return this.clientes().filter((cliente) => {
      const passaNoFiltro =
        filtro === 'TODOS' ||
        (filtro === 'ATIVOS' && cliente.ativo) ||
        (filtro === 'INATIVOS' && !cliente.ativo);

      if (!passaNoFiltro) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const nome = cliente.nomeCompleto.toLowerCase();
      const apelido = cliente.apelido?.toLowerCase() ?? '';
      const whatsapp = cliente.whatsapp.toLowerCase();

      return nome.includes(termo) || apelido.includes(termo) || whatsapp.includes(termo);
    });
  });

  constructor() {
    this.carregarClientes();
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  novoCliente(): void {
    this.router.navigate(['/novo-cliente']);
  }

  editarCliente(id: number): void {
    this.router.navigate(['/novo-cliente'], {
      queryParams: {
        id,
      },
    });
  }

  alterarBusca(valor: string): void {
    this.termoBusca.set(valor);
  }

  alterarFiltro(filtro: FiltroCliente): void {
    this.filtroCliente.set(filtro);
  }

  inativarCliente(cliente: Cliente): void {
    this.dialogService.confirmDialog({
      header: 'Inativar cliente',
      message: `Deseja inativar ${cliente.nomeCompleto}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, inativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.clienteService
          .inativar(cliente.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (clienteAtualizado) => {
              const clienteMapeado = mapClienteResponseToModel(clienteAtualizado);

              this.clientes.update((clientes) =>
                clientes.map((item) =>
                  item.id === clienteMapeado.id ? clienteMapeado : item
                )
              );

              this.dialogService.success('A cliente foi inativada com sucesso.', 'Cliente inativada');
            },
            error: (error: HttpErrorResponse) => {
              this.dialogService.error(this.extrairMensagemErro(error));
            },
          });
      },
    });
  }

  ativarCliente(cliente: Cliente): void {
    this.dialogService.confirmDialog({
      header: 'Ativar cliente',
      message: `Deseja ativar ${cliente.nomeCompleto}?`,
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, ativar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.clienteService
          .ativar(cliente.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (clienteAtualizado) => {
              const clienteMapeado = mapClienteResponseToModel(clienteAtualizado);

              this.clientes.update((clientes) =>
                clientes.map((item) =>
                  item.id === clienteMapeado.id ? clienteMapeado : item
                )
              );

              this.dialogService.success('A cliente foi ativada com sucesso.', 'Cliente ativada');
            },
            error: (error: HttpErrorResponse) => {
              this.dialogService.error(this.extrairMensagemErro(error));
            },
          });
      },
    });
  }

  excluirDefinitivo(cliente: Cliente): void {
    this.dialogService.confirmDialog({
      header: 'Excluir definitivamente',
      message: `Deseja excluir definitivamente ${cliente.nomeCompleto}? Essa ação não poderá ser desfeita.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sim, excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.clienteService
          .removerDefinitivo(cliente.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.clientes.update((clientes) =>
                clientes.filter((item) => item.id !== cliente.id)
              );

              this.dialogService.success('A cliente foi excluída definitivamente.', 'Cliente excluída');
            },
            error: (error: HttpErrorResponse) => {
              this.dialogService.error(this.extrairMensagemErro(error));
            },
          });
      },
    });
  }

  private carregarClientes(): void {
    this.carregando.set(true);

    this.clienteService.listar().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clientes) => {
          this.clientes.set(clientes.map(mapClienteResponseToModel));
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.dialogService.error('Não foi possível carregar as clientes.');
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

    return 'Não foi possível concluir a operação.';
  }
}