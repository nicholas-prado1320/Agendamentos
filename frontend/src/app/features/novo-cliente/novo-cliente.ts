import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  private readonly clienteService = inject(ClienteService);

  form = this.fb.group({
    nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
    apelido: [''],
    whatsapp: ['', [Validators.required]]
  });

  salvar(): void {
    if (this.form.valid) {
      this.clienteService.adicionarCliente(this.form.getRawValue());
      this.router.navigate(['/clientes']);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}