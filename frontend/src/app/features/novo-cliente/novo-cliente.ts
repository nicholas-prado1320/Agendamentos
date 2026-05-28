import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../core/service/cliente.service';

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
  private readonly clienteService = inject(ClienteService);

  private readonly clienteId = this.route.snapshot.queryParamMap.get('id');

  readonly modoEdicao = computed(() => !!this.clienteId);

  readonly form = this.fb.group({
    nomeCompleto: ['', [Validators.required]],
    apelido: [''],
    whatsapp: ['', [Validators.required]],
  });

  constructor() {
    if (!this.clienteId) {
      return;
    }
    const cliente = this.clienteService.buscarPorId(this.clienteId);
    if (!cliente) {
      this.router.navigate(['/clientes']);
      return;
    }
    this.form.patchValue({
      nomeCompleto: cliente.nomeCompleto,
      apelido: cliente.apelido ?? '',
      whatsapp: cliente.whatsapp,
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dados = this.form.getRawValue();
    if (this.clienteId) {
      this.clienteService.editarCliente({
        id: this.clienteId,
        ...dados,
      });
      this.router.navigate(['/clientes']);
      return;
    }
    this.clienteService.adicionarCliente(dados);
    this.router.navigate(['/clientes']);
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}