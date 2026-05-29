import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { PeonyTheme } from './core/theme/peony-theme';
import { ConfirmationService, MessageService } from 'primeng/api';
import ptBr from 'primelocale/pt-br.json';
import { authInterceptor } from './core/interceptor/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: PeonyTheme,
        options: {
          darkModeSelector: false
        }
      }, translation: ptBr['pt-BR']
    }),
    MessageService,
    ConfirmationService
  ]
};