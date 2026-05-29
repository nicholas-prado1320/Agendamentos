import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClienteService } from '../../core/service/cliente.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Cliente } from '../../core/models/cliente.model';
import { mapClienteResponseToModel } from '../../core/mappers/cliente.mapper';
import { DialogService } from '../../core/service/dialog.service';

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
  public readonly clientes = signal<Cliente[]>([]);
  public readonly carregando = signal(false);

  menuAberto = false;

  public readonly clientesFiltrados = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    if (!termo) {
      return this.clientes();
    }
    return this.clientes().filter((cliente) => {
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

  removerCliente(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Remover cliente',
      message: 'Deseja remover esta cliente?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.clienteService.remover(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.clientes.update((clientes) => clientes.filter((cliente) => cliente.id !== id)
            );
            this.dialogService.success('A cliente foi inativada com sucesso.', 'Cliente removida');
          },
          error: () => {
            this.dialogService.error('Não foi possível remover a cliente.');
          },
        });
      },
    });
  }

  private carregarClientes(): void {
    this.carregando.set(true);
    this.clienteService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (clientes) => {
        this.clientes.set(clientes.map(mapClienteResponseToModel));
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        alert('Não foi possível carregar as clientes.');
      },
    });
  }
}