import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PushSubscriptionRequest {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

const PUSH_PERMISSION_ASKED_KEY = 'push_permission_asked';

@Injectable({
    providedIn: 'root',
})
export class PushNotificationService {
    private readonly http = inject(HttpClient);
    private readonly swPush = inject(SwPush);

    private readonly apiUrl = `${environment.apiUrl}/push-notifications`;

    get notificacoesDisponiveis(): boolean {
        return this.swPush.isEnabled;
    }

    get permissaoJaSolicitada(): boolean {
        return localStorage.getItem(PUSH_PERMISSION_ASKED_KEY) === 'true';
    }

    marcarPermissaoComoSolicitada(): void {
        localStorage.setItem(PUSH_PERMISSION_ASKED_KEY, 'true');
    }

    estaRodandoComoPwa(): boolean {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true
        );
    }

    deveExibirConviteInicial(): boolean {
        return (
            this.estaRodandoComoPwa() &&
            this.notificacoesDisponiveis &&
            Notification.permission === 'default' &&
            !this.permissaoJaSolicitada
        );
    }

    ativarNotificacoes(): Observable<void> {
        if (!this.swPush.isEnabled) {
            return throwError(() => new Error('As notificações PWA não estão habilitadas neste ambiente.'));
        }

        return from(
            this.swPush.requestSubscription({
                serverPublicKey: environment.vapidPublicKey,
            })
        ).pipe(
            switchMap((subscription: PushSubscription) => {
                const payload = this.converterSubscription(subscription);

                return this.http.post<void>(`${this.apiUrl}/subscribe`, payload);
            })
        );
    }

    enviarTeste(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/teste`, {});
    }

    private converterSubscription(subscription: PushSubscription): PushSubscriptionRequest {
        const json = subscription.toJSON();

        return {
            endpoint: json.endpoint ?? '',
            keys: {
                p256dh: json.keys?.['p256dh'] ?? '',
                auth: json.keys?.['auth'] ?? '',
            },
        };
    }
}