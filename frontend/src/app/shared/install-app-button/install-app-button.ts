import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PwaInstallService } from '../../core/service/pwa-install.service';
import { DialogService } from '../../core/service/dialog.service';

@Component({
  selector: 'app-install-app-button',
  imports: [ButtonModule],
  templateUrl: './install-app-button.html',
  styleUrl: './install-app-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallAppButton {
  public readonly pwaInstallService = inject(PwaInstallService);

  private readonly dialogService = inject(DialogService);

  public readonly instalando = signal(false);
  public readonly mostrarInstrucoesIos = signal(false);

  public readonly labelBotao = computed(() => {
    if (this.pwaInstallService.ehIos()) {
      return 'Como instalar no iPhone';
    }

    return 'Instalar aplicativo';
  });

  public readonly iconeBotao = computed(() => {
    if (this.pwaInstallService.ehIos()) {
      return 'pi pi-apple';
    }

    return 'pi pi-download';
  });

  async acionar(): Promise<void> {
    if (this.pwaInstallService.ehIos()) {
      this.mostrarInstrucoesIos.update((valor) => !valor);
      return;
    }

    if (!this.pwaInstallService.podeInstalar()) {
      this.dialogService.error(
        'A instalação ainda não está disponível neste navegador. Tente acessar pelo Chrome/Edge ou verifique se o aplicativo já está instalado.'
      );
      return;
    }

    this.instalando.set(true);

    const resultado = await this.pwaInstallService.instalar();

    this.instalando.set(false);

    if (resultado === 'accepted') {
      this.dialogService.success('Aplicativo instalado com sucesso.');
      return;
    }

    if (resultado === 'dismissed') {
      this.dialogService.error('Instalação cancelada.');
      return;
    }

    this.dialogService.error('Não foi possível iniciar a instalação do aplicativo.');
  }
}