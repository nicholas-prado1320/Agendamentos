import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/service/auth.service';
import { DialogService } from '../../core/service/dialog.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { HorarioAtendimentoService } from '../../core/service/horario-atendimento.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly horarioAtendimentoService = inject(HorarioAtendimentoService);

  public readonly carregando = signal(false);

  public readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.carregando.set(true);
    this.authService.login(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  private verificarHorarioManicure(): void {
    this.horarioAtendimentoService.verificarConfiguracao().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.carregando.set(false);
        if (response.configurado) {
          this.router.navigate(['/home']);
          return;
        }
        this.router.navigate(['/horarios']);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/horarios']);
      },
    });
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.message) {
      return apiError.message;
    }
    return 'E-mail ou senha inválidos.';
  }
}