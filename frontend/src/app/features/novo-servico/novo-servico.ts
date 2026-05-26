import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ServicoService } from '../../core/service/servicos.service';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-novo-servico',
  imports: [ReactiveFormsModule, RouterModule, SelectModule],
  templateUrl: './novo-servico.html',
  styleUrl: './novo-servico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoServico {
  private fb = inject(NonNullableFormBuilder);
  private servicoService = inject(ServicoService);
  private router = inject(Router);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    descricao: [''],
    duracao: ['', [Validators.required]]
  });


  public readonly opcoesDuracao = ['30 min', '45 min', '1h', '1h 30min', '2h', '2h 30min', '3h'];

  salvar(): void {
    if (this.form.valid) {
      this.servicoService.adicionarServico(this.form.getRawValue());
      this.router.navigate(['/servicos']);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.router.navigate(['/servicos']);
  }
}