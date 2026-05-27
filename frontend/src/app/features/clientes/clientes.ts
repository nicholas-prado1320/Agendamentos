import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../core/service/cliente.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';

@Component({
  selector: 'app-clientes',
  imports: [RouterModule, FormsModule, AppDrawerComponent],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes {
  private readonly router = inject(Router);
  private readonly clienteService = inject(ClienteService);

  public readonly termoBusca = signal('');

  menuAberto = false;

  public readonly clientesFiltrados = computed(() => {
    return this.clienteService.buscarPorTexto(this.termoBusca());
  });

  abrirMenu(): void {
    this.menuAberto = true;
  }

  novoCliente(): void {
    this.router.navigate(['/novo-cliente']);
  }

  alterarBusca(valor: string): void {
    this.termoBusca.set(valor);
  }

  removerCliente(id: string): void {
    const confirmou = confirm('Deseja remover esta cliente?');
    if (!confirmou) {
      return;
    }
    this.clienteService.removerCliente(id);
  }
}