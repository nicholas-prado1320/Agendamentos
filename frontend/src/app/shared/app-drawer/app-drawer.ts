import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../../core/service/auth.service';

type DrawerRoute = 'home' | 'novo-agendamento' | 'agendamentos' | 'clientes' | 'servicos' | 'novo-cliente' | 'novo-servico';

@Component({
  selector: 'app-drawer',
  imports: [DrawerModule],
  templateUrl: './app-drawer.html',
  styleUrl: './app-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDrawerComponent {
  private readonly router = inject(Router);

  public readonly authService = inject(AuthService);

  visible = model(false);

  private rotaPendente: string | null = null;

  private readonly rotas: Record<DrawerRoute, string> = {
    home: '/home',
    'novo-agendamento': '/novo-agendamento',
    agendamentos: '/agendamentos',
    clientes: '/clientes',
    servicos: '/servicos',
    'novo-cliente': '/novo-cliente',
    'novo-servico': '/novo-servico',
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

  sair(): void {
    this.visible.set(false);
    this.authService.logout();
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