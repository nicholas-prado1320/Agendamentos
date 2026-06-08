import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-esqueci-senha',
  imports: [
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    InputTextModule,
  ],
  templateUrl: './esqueci-senha.html',
  styleUrl: './esqueci-senha.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsqueciSenha {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  public readonly carregando = signal(false);

  public readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);

    this.authService.solicitarRecuperacaoSenha(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.dialogService.info('Se o e-mail existir, enviaremos uma senha temporária para acesso.');
          this.router.navigate(['/login']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao recuperar senha');
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/login']);
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;

    if (apiError?.message) {
      return apiError.message;
    }

    return 'Não foi possível solicitar a recuperação de senha.';
  }
}