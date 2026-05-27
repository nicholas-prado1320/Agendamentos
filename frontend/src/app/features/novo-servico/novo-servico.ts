import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

import { ServicoService } from '../../core/service/servicos.service';

@Component({
  selector: 'app-novo-servico',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    FloatLabelModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
  ],
  templateUrl: './novo-servico.html',
  styleUrl: './novo-servico.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NovoServico {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly servicoService = inject(ServicoService);

  private readonly servicoId = this.route.snapshot.queryParamMap.get('id');

  readonly modoEdicao = computed(() => !!this.servicoId);

  readonly opcoesDuracao = signal<string[]>([
    '30 min',
    '45 min',
    '1h',
    '1h 30min',
    '2h',
    '2h 30min',
    '3h',
  ]);

  readonly form = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    duracao: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    if (!this.servicoId) {
      return;
    }

    const servico = this.servicoService.buscarPorId(this.servicoId);

    if (!servico) {
      this.router.navigate(['/servicos']);
      return;
    }

    this.form.patchValue({
      nome: servico.nome,
      descricao: servico.descricao ?? '',
      duracao: servico.duracao,
      preco: servico.preco,
    });

    this.adicionarDuracaoNaLista(servico.duracao);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dados = this.form.getRawValue();
    const duracaoTratada = dados.duracao.trim();

    this.adicionarDuracaoNaLista(duracaoTratada);

    const payload = {
      ...dados,
      duracao: duracaoTratada,
    };

    if (this.servicoId) {
      this.servicoService.editarServico({
        id: this.servicoId,
        ...payload,
      });

      this.router.navigate(['/servicos']);
      return;
    }

    this.servicoService.adicionarServico(payload);
    this.router.navigate(['/servicos']);
  }

  cancelar(): void {
    this.router.navigate(['/servicos']);
  }

  private adicionarDuracaoNaLista(duracao: string): void {
    const valor = duracao.trim();

    if (!valor) {
      return;
    }

    const jaExiste = this.opcoesDuracao().some((item) => item.toLowerCase() === valor.toLowerCase());

    if (jaExiste) {
      return;
    }

    this.opcoesDuracao.update((lista) => [...lista, valor]);
  }
}