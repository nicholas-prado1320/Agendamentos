import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, UsuarioLogado } from '../models/dtos/auth.dto';

const TOKEN_KEY = 'agendamentos_token';
const USER_KEY = 'agendamentos_user';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiUrl = `${environment.apiUrl}/auth`;

    private readonly usuarioLogadoSignal = signal<UsuarioLogado | null>(
        this.obterUsuarioDoStorage()
    );

    public readonly usuarioLogado = this.usuarioLogadoSignal.asReadonly();

    public readonly role = computed(() => this.usuarioLogadoSignal()?.role ?? null);
    public readonly isManicure = computed(() => this.role() === 'MANICURE');
    public readonly isCliente = computed(() => this.role() === 'CLIENTE');
    public readonly autenticado = computed(() => !!this.token && !!this.usuarioLogadoSignal());

    get token(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap((response) => {
                this.salvarSessao(response);
            })
        );
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this.usuarioLogadoSignal.set(null);
        this.router.navigate(['/login']);
    }

    private salvarSessao(response: AuthResponse): void {
        const usuario: UsuarioLogado = {
            id: response.id,
            nome: response.nome,
            email: response.email,
            role: response.role,
        };
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
        this.usuarioLogadoSignal.set(usuario);
    }

    private obterUsuarioDoStorage(): UsuarioLogado | null {
        const usuarioJson = localStorage.getItem(USER_KEY);
        if (!usuarioJson) {
            return null;
        }
        try {
            return JSON.parse(usuarioJson) as UsuarioLogado;
        } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            return null;
        }
    }
}