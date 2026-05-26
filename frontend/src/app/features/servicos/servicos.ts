import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServicoService } from '../../core/service/servicos.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';

@Component({
  selector: 'app-servicos',
  imports: [AppDrawerComponent, RouterModule],
  templateUrl: './servicos.html',
  styleUrl: './servicos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Servicos {
  private servicoService = inject(ServicoService);

  public readonly servicos = this.servicoService.servicos;

  menuAberto = false;

  abrirMenu(): void {
    this.menuAberto = true;
  }
}
