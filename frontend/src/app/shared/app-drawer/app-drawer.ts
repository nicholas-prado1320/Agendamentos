import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

type DrawerRoute = 'home' | 'novo-agendamento' | 'agendamentos' | 'clientes' | 'servicos';

@Component({
  selector: 'app-drawer',
  imports: [DrawerModule],
  templateUrl: './app-drawer.html',
  styleUrl: './app-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDrawerComponent {
  private readonly router = inject(Router);

  visible = model(false);

  private rotaPendente: string | null = null;

  private readonly rotas: Record<DrawerRoute, string> = {
    home: '/home',
    'novo-agendamento': '/novo-agendamento',
    agendamentos: '/agendamentos',
    clientes: '/clientes',
    servicos: '/servicos',
  };

  alterarVisibilidade(aberto: boolean): void {
    this.visible.set(aberto);
    if (!aberto) {
      this.finalizarNavegacao();
    }
  }

  navegarPara(rota: DrawerRoute): void {
    const destino = this.rotas[rota];
    const urlAtual = this.router.url.split('?')[0];
    if (urlAtual === destino) {
      this.visible.set(false);
      return;
    }
    this.rotaPendente = destino;
    this.visible.set(false);
    window.setTimeout(() => {
      this.finalizarNavegacao();
    }, 250);
  }

  finalizarNavegacao(): void {
    if (!this.rotaPendente) {
      return;
    }
    const destino = this.rotaPendente;
    this.rotaPendente = null;
    this.limparMascaraPreso();
    this.router.navigate([destino]);
  }

  rotaAtiva(rota: DrawerRoute): boolean {
    const urlAtual = this.router.url.split('?')[0];
    return urlAtual === this.rotas[rota];
  }

  private limparMascaraPreso(): void {
    document.body.classList.remove('p-overflow-hidden');
    const mascaras = document.querySelectorAll('.p-drawer-mask, .p-overlay-mask');
    mascaras.forEach((mascara) => {
      mascara.remove();
    });
  }
}