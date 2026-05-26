import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { ClienteService } from '../../core/service/cliente.service';

@Component({
  selector: 'app-clientes',
  imports: [AppDrawerComponent, RouterModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clientes {

  private readonly clienteService = inject(ClienteService);

  public readonly clientes = this.clienteService.clientes;

  menuAberto = false;

  abrirMenu() {
    this.menuAberto = true;
  }

  fecharMenu() {
    this.menuAberto = false;
  }
}