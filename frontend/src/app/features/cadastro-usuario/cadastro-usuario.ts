import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-cadastro-usuario',
  imports: [
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    InputMaskModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './cadastro-usuario.html',
  styleUrl: './cadastro-usuario.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroUsuario {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  public readonly carregando = signal(false);

  public readonly form = this.fb.group({
    nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
    apelido: [''],
    email: ['', [Validators.required, Validators.email]],
    whatsapp: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]],
  });

  cadastrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.form.getRawValue();
    if (request.senha !== request.confirmarSenha) {
      this.dialogService.error('As senhas não conferem.', 'Erro no cadastro');
      return;
    }
    this.carregando.set(true);
    this.authService.cadastrarCliente({
      nomeCompleto: request.nomeCompleto,
      apelido: request.apelido || null,
      email: request.email,
      whatsapp: this.normalizarWhatsapp(request.whatsapp),
      senha: request.senha,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.carregando.set(false);
        this.dialogService.success('Cadastro realizado. Enviamos um código para seu e-mail.');
        this.router.navigate(['/validar-email'], {
          queryParams: {
            email: request.email,
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao cadastrar');
      },
    });
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
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
    return 'Não foi possível realizar o cadastro.';
  }
}