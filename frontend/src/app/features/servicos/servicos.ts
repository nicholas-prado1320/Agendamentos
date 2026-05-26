import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServicoService } from '../../core/service/servicos.service';

@Component({
  selector: 'app-servicos',
  imports: [RouterModule],
  templateUrl: './servicos.html',
  styleUrl: './servicos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Servicos {
  private servicoService = inject(ServicoService);

  public readonly servicos = this.servicoService.servicos;
}
