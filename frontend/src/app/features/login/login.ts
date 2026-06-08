import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { HorarioAtendimentoService } from '../../core/service/horario-atendimento.service';

declare const google: any;

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    DialogModule,
    DividerModule,
    FloatLabelModule,
    InputMaskModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly horarioAtendimentoService = inject(HorarioAtendimentoService);

  public readonly carregando = signal(false);
  public readonly carregandoGoogle = signal(false);
  public readonly modalWhatsappGoogle = signal(false);
  public readonly googleNome = signal('');
  public readonly googleEmail = signal('');

  private googleCredential = '';

  public readonly form = this.fb.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  public readonly googleForm = this.fb.group({
    whatsapp: ['', [Validators.required]],
  });

  ngAfterViewInit(): void {
    window.setTimeout(() => {
      this.inicializarGoogle();
    }, 300);
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);

    this.authService.login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.dialogService.success('Login realizado com sucesso.');

          if (response.role === 'MANICURE') {
            this.verificarHorarioManicure();
            return;
          }

          this.carregando.set(false);
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao entrar');
        },
      });
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }

  irParaEsqueciSenha(): void {
    this.router.navigate(['/esqueci-senha']);
  }

  concluirCadastroGoogle(): void {
    if (this.googleForm.invalid) {
      this.googleForm.markAllAsTouched();
      return;
    }

    this.carregandoGoogle.set(true);

    this.authService.completarCadastroGoogle({
      credential: this.googleCredential,
      whatsapp: this.normalizarWhatsapp(this.googleForm.controls.whatsapp.value),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.carregandoGoogle.set(false);
          this.modalWhatsappGoogle.set(false);
          this.dialogService.success('Conta criada com Google com sucesso.');

          if (response.role === 'MANICURE') {
            this.verificarHorarioManicure();
            return;
          }

          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregandoGoogle.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao concluir cadastro');
        },
      });
  }

  private inicializarGoogle(): void {
    if (typeof google === 'undefined') {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        this.ngZone.run(() => {
          this.processarCredentialGoogle(response.credential);
        });
      },
    });

    google.accounts.id.renderButton(
      document.getElementById('google-login-button'),
      {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 300,
      }
    );
  }

  private processarCredentialGoogle(credential: string): void {
    this.carregandoGoogle.set(true);
    this.googleCredential = credential;

    this.authService.loginGoogle({ credential })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.carregandoGoogle.set(false);

          if (response.cadastroPendente) {
            this.googleNome.set(response.nome);
            this.googleEmail.set(response.email);
            this.modalWhatsappGoogle.set(true);
            return;
          }

          this.dialogService.success('Login realizado com sucesso.');

          if (response.auth?.role === 'MANICURE') {
            this.verificarHorarioManicure();
            return;
          }

          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregandoGoogle.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro no Google');
        },
      });
  }

  private verificarHorarioManicure(): void {
    this.horarioAtendimentoService.verificarConfiguracao()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.carregando.set(false);
          this.carregandoGoogle.set(false);

          if (response.configurado) {
            this.router.navigate(['/home']);
            return;
          }

          this.router.navigate(['/horarios']);
        },
        error: () => {
          this.carregando.set(false);
          this.carregandoGoogle.set(false);
          this.router.navigate(['/horarios']);
        },
      });
  }

  private normalizarWhatsapp(whatsapp: string): string {
    let apenasNumeros = whatsapp.replace(/\D/g, '');
    if (apenasNumeros.startsWith('55') && apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.substring(2);
    }
    if (apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.slice(-11);
    }
    return apenasNumeros;
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível concluir a operação.';
  }
}