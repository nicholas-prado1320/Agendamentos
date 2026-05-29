import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ClienteService } from '../../core/service/cliente.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';

@Component({
  selector: 'app-novo-cliente',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './novo-cliente.html',
  styleUrl: './novo-cliente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoCliente {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly clienteService = inject(ClienteService);

  private readonly clienteId = Number(this.route.snapshot.queryParamMap.get('id')) || null;

  public readonly salvando = signal(false);
  public readonly carregando = signal(false);
  public readonly modoEdicao = computed(() => !!this.clienteId);

  public readonly form = this.fb.group({
    nomeCompleto: ['', [Validators.required]],
    apelido: [''],
    whatsapp: ['', [Validators.required]],
  });

  constructor() {
    if (this.clienteId) {
      this.carregarCliente(this.clienteId);
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = this.form.getRawValue();
    const payload = {
      nomeCompleto: dados.nomeCompleto.trim(),
      apelido: dados.apelido.trim() || undefined,
      whatsapp: dados.whatsapp.trim(),
    };

    this.salvando.set(true);

    if (this.clienteId) {
      this.clienteService.atualizar(this.clienteId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.salvando.set(false);
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          this.salvando.set(false);
          alert(this.extrairMensagemErro(error));
        },
      });
      return;
    }
    this.clienteService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/clientes']);
      },
      error: (error) => {
        this.salvando.set(false);
        alert(this.extrairMensagemErro(error));
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }

  private carregarCliente(id: number): void {
    this.carregando.set(true);
    this.clienteService.buscarPorId(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          nomeCompleto: cliente.nomeCompleto,
          apelido: cliente.apelido ?? '',
          whatsapp: cliente.whatsapp,
        });
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.router.navigate(['/clientes']);
      },
    });
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível salvar a cliente.';
  }
}