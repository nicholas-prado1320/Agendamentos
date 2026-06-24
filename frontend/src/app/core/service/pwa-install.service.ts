import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
}

@Injectable({
    providedIn: 'root',
})
export class PwaInstallService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    private readonly eventoInstalacao = signal<BeforeInstallPromptEvent | null>(null);
    private readonly appInstalado = signal(false);
    private readonly dispositivoIos = signal(false);

    public readonly ehIos = computed(() => this.isBrowser && this.dispositivoIos());
    public readonly instalado = computed(() => this.isBrowser && this.appInstalado());

    public readonly podeInstalar = computed(() => {
        return this.isBrowser && !!this.eventoInstalacao() && !this.appInstalado();
    });

    public readonly podeMostrarAjudaIos = computed(() => {
        return this.isBrowser && this.dispositivoIos() && !this.appInstalado();
    });

    public readonly deveMostrarBotao = computed(() => {
        return this.podeInstalar() || this.podeMostrarAjudaIos();
    });

    constructor() {
        if (!this.isBrowser) {
            return;
        }
        this.dispositivoIos.set(this.verificarSeEhIos());
        this.appInstalado.set(this.verificarSeJaEstaInstalado());
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            this.eventoInstalacao.set(event as BeforeInstallPromptEvent);
        });
        window.addEventListener('appinstalled', () => {
            this.appInstalado.set(true);
            this.eventoInstalacao.set(null);
        });
    }

    async instalar(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
        const evento = this.eventoInstalacao();
        if (!evento) {
            return 'unavailable';
        }
        await evento.prompt();
        const escolha = await evento.userChoice;
        this.eventoInstalacao.set(null);
        if (escolha.outcome === 'accepted') {
            this.appInstalado.set(true);
        }
        return escolha.outcome;
    }

    private verificarSeJaEstaInstalado(): boolean {
        const modoStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const navegadorIosStandalone = 'standalone' in window.navigator &&
            Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
        return modoStandalone || navegadorIosStandalone;
    }

    private verificarSeEhIos(): boolean {
        const modoTesteIos = !environment.production &&
            window.location.search.includes('ios-test=true');

        if (modoTesteIos) {
            return true;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const platform = window.navigator.platform?.toLowerCase() ?? '';

        const iphoneOuIpad = /iphone|ipad|ipod/.test(userAgent);
        const ipadModoDesktop = platform === 'macintel' && window.navigator.maxTouchPoints > 1;

        return iphoneOuIpad || ipadModoDesktop;
    }
}