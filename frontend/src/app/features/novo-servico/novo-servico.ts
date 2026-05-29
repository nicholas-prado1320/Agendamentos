import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ServicoService } from '../../core/service/servicos.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { DialogService } from '../../core/service/dialog.service';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly servicoService = inject(ServicoService);
  private readonly dialogService = inject(DialogService);
  private readonly servicoId = Number(this.route.snapshot.queryParamMap.get('id')) || null;

  public readonly salvando = signal(false);
  public readonly carregando = signal(false);
  public readonly modoEdicao = computed(() => !!this.servicoId);

  public readonly opcoesDuracao = signal<string[]>([
    '30 min',
    '45 min',
    '1h',
    '1h 30min',
    '2h',
    '2h 30min',
    '3h',
  ]);

  public readonly form = this.fb.group({
    nome: ['', [Validators.required]],
    descricao: [''],
    duracao: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    if (this.servicoId) {
      this.carregarServico(this.servicoId);
    }
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
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim() || undefined,
      duracao: duracaoTratada,
      preco: dados.preco,
    };

    this.salvando.set(true);

    if (this.servicoId) {
      this.servicoService.atualizar(this.servicoId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.salvando.set(false);
          this.dialogService.success('Serviço atualizado com sucesso!');
          this.router.navigate(['/servicos']);
        },
        error: (error) => {
          this.salvando.set(false);
          this.dialogService.error(this.extrairMensagemErro(error));
        },
      });

      return;
    }

    this.servicoService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogService.success('Serviço criado com sucesso!');
        this.router.navigate(['/servicos']);
      },
      error: (error) => {
        this.salvando.set(false);
        this.dialogService.error(this.extrairMensagemErro(error));
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/servicos']);
  }

  private carregarServico(id: number): void {
    this.carregando.set(true);

    this.servicoService.buscarPorId(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (servico) => {
        this.form.patchValue({
          nome: servico.nome,
          descricao: servico.descricao ?? '',
          duracao: servico.duracao,
          preco: servico.preco,
        });
        this.adicionarDuracaoNaLista(servico.duracao);
        this.carregando.set(false);
      },
      error: () => {
        this.dialogService.error('Não foi possível carregar o serviço.');
        this.carregando.set(false);
        this.router.navigate(['/servicos']);
      },
    });
  }

  private adicionarDuracaoNaLista(duracao: string): void {
    const valor = duracao.trim();
    if (!valor) {
      return;
    }
    const jaExiste = this.opcoesDuracao().some(
      (item) => item.toLowerCase() === valor.toLowerCase()
    );
    if (jaExiste) {
      return;
    }
    this.opcoesDuracao.update((lista) => [...lista, valor]);
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;
    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }
    if (apiError?.message) {
      return apiError.message;
    }
    return 'Não foi possível salvar o serviço.';
  }
}