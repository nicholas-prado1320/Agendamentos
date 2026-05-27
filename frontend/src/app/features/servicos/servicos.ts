import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ServicoService } from '../../core/service/servicos.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';

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
  private readonly servicoService = inject(ServicoService);

  readonly filtroSelecionado = signal<FiltroServico>('ativos');

  readonly filtros: { label: string; value: FiltroServico }[] = [
    { label: 'Ativos', value: 'ativos' },
    { label: 'Inativos', value: 'inativos' },
    { label: 'Todos', value: 'todos' },
  ];

  menuAberto = false;

  readonly servicosFiltrados = computed(() => {
    const filtro = this.filtroSelecionado();
    const servicos = this.servicoService.servicos();

    if (filtro === 'ativos') {
      return servicos.filter((servico) => servico.ativo);
    }

    if (filtro === 'inativos') {
      return servicos.filter((servico) => !servico.ativo);
    }

    return servicos;
  });

  abrirMenu(): void {
    this.menuAberto = true;
  }

  novoServico(): void {
    this.router.navigate(['/novo-servico']);
  }

  alterarFiltro(filtro: FiltroServico): void {
    this.filtroSelecionado.set(filtro);
  }

  editarServico(id: string): void {
    this.router.navigate(['/novo-servico'], {
      queryParams: {
        id,
      },
    });
  }

  inativarServico(id: string): void {
    const confirmou = confirm('Deseja inativar este serviço?');

    if (!confirmou) {
      return;
    }

    this.servicoService.inativarServico(id);
  }

  ativarServico(id: string): void {
    this.servicoService.ativarServico(id);
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}