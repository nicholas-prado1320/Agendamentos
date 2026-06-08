import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-redefinir-senha',
  imports: [
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    PasswordModule,
  ],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedefinirSenha {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  public readonly carregando = signal(false);

  public readonly form = this.fb.group({
    senhaAtual: ['', [Validators.required]],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required]],
  });

  alterarSenha(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.form.getRawValue();

    if (request.novaSenha !== request.confirmarSenha) {
      this.dialogService.error('As senhas não conferem.', 'Erro');
      return;
    }

    this.carregando.set(true);

    this.authService.alterarSenha({
      senhaAtual: request.senhaAtual,
      novaSenha: request.novaSenha,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.dialogService.success('Senha alterada com sucesso.');

          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao alterar senha');
        },
      });
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível alterar sua senha.';
  }
}