import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputOtpModule } from 'primeng/inputotp';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-validar-email',
  imports: [
    ReactiveFormsModule,
    AvatarModule,
    ButtonModule,
    CardModule,
    InputOtpModule,
  ],
  templateUrl: './validar-email.html',
  styleUrl: './validar-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarEmail {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  public readonly carregando = signal(false);
  public readonly reenviando = signal(false);

  public readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';

  public readonly form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  validar(): void {
    if (!this.email) {
      this.dialogService.error('E-mail não informado. Faça o cadastro novamente.', 'Erro');
      this.router.navigate(['/cadastro']);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando.set(true);

    this.authService.validarEmail({
      email: this.email,
      codigo: this.form.controls.codigo.value,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.carregando.set(false);
          this.dialogService.success('E-mail validado com sucesso!');

          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.carregando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao validar e-mail');
        },
      });
  }

  reenviarCodigo(): void {
    if (!this.email) {
      this.dialogService.error('E-mail não informado. Faça o cadastro novamente.', 'Erro');
      this.router.navigate(['/cadastro']);
      return;
    }

    this.reenviando.set(true);

    this.authService.reenviarCodigoEmail({
      email: this.email,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reenviando.set(false);
          this.dialogService.success('Enviamos um novo código para seu e-mail.');
        },
        error: (error: HttpErrorResponse) => {
          this.reenviando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error), 'Erro ao reenviar código');
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
    return 'Não foi possível validar o código.';
  }
}