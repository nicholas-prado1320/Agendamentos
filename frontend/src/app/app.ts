import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PwaInstallService } from './core/service/pwa-install.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ConfirmDialogModule, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Agendamentos');

  private readonly pwaInstallService = inject(PwaInstallService);
}
