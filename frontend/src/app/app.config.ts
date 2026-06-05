import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { PeonyTheme } from './core/theme/peony-theme';
import { ConfirmationService, MessageService } from 'primeng/api';
import ptBr from 'primelocale/pt-BR.json';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    providePrimeNG({
      theme: {
        preset: PeonyTheme,
        options: {
          darkModeSelector: false
        }
      }, translation: ptBr['pt-BR']
    }),
    MessageService,
    ConfirmationService,
  ]
};