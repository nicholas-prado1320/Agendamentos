import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    AlterarSenhaRequest,
    AuthResponse,
    CadastroClienteRequest,
    EsqueciSenhaRequest,
    GoogleLoginRequest,
    LoginRequest,
    ReenviarCodigoEmailRequest,
    UsuarioLogado,
    ValidarEmailRequest,
    GoogleCompletarCadastroRequest,
    GoogleAuthResponse
} from '../models/dtos/auth.dto';

const TOKEN_KEY = 'agendamentos_token';
const USER_KEY = 'agendamentos_user';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly authApiUrl = `${environment.apiUrl}/auth`;
    private readonly usuariosApiUrl = `${environment.apiUrl}/usuarios`;
    private readonly usuarioLogadoSignal = signal<UsuarioLogado | null>(this.obterUsuarioDoStorage());

    public readonly usuarioLogado = this.usuarioLogadoSignal.asReadonly();
    public readonly role = computed(() => this.usuarioLogadoSignal()?.role ?? null);
    public readonly isManicure = computed(() => this.role() === 'MANICURE');
    public readonly isCliente = computed(() => this.role() === 'CLIENTE');
    public readonly clienteId = computed(() => this.usuarioLogadoSignal()?.clienteId ?? null);
    public readonly autenticado = computed(() => !!this.token && !!this.usuarioLogadoSignal());

    get token(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, request).pipe(
            tap((response) => {
                this.salvarSessao(response);
            })
        );
    }

    cadastrarCliente(request: CadastroClienteRequest): Observable<void> {
        return this.http.post<void>(`${this.authApiUrl}/register-cliente`, request);
    }

    loginGoogle(request: GoogleLoginRequest): Observable<GoogleAuthResponse> {
        return this.http.post<GoogleAuthResponse>(`${this.authApiUrl}/google`, request).pipe(
            tap((response) => {
                if (!response.cadastroPendente && response.auth) {
                    this.salvarSessao(response.auth);
                }
            })
        );
    }

    completarCadastroGoogle(request: GoogleCompletarCadastroRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.authApiUrl}/google/completar-cadastro`, request).pipe(
            tap((response) => {
                this.salvarSessao(response);
            })
        );
    }

    validarEmail(request: ValidarEmailRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.authApiUrl}/validar-email`, request).pipe(
            tap((response) => {
                this.salvarSessao(response);
            })
        );
    }

    reenviarCodigoEmail(request: ReenviarCodigoEmailRequest): Observable<void> {
        return this.http.post<void>(`${this.authApiUrl}/reenviar-codigo-email`, request);
    }

    solicitarRecuperacaoSenha(request: EsqueciSenhaRequest): Observable<void> {
        return this.http.post<void>(`${this.authApiUrl}/esqueci-senha`, request);
    }

    alterarSenha(request: AlterarSenhaRequest): Observable<void> {
        return this.http.post<void>(`${this.usuariosApiUrl}/alterar-senha`, request);
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
            clienteId: response.clienteId,
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