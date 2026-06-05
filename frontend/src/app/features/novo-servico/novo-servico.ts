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
import { DatePickerModule } from 'primeng/datepicker';
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
    DatePickerModule,
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

  public readonly duracaoPadrao = this.criarDataDuracao(0, 15);

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
    duracao: [null as Date | null, [Validators.required]],
    preco: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.form.controls.duracao.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((duracao) => {
        this.normalizarDuracaoNaGrade(duracao);
      });

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

    let duracaoTratada: string;

    try {
      duracaoTratada = this.formatarDuracaoParaBackend(dados.duracao);
    } catch (error) {
      this.dialogService.error(
        error instanceof Error ? error.message : 'A duração do serviço é inválida.'
      );
      return;
    }

    const payload = {
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim() || undefined,
      duracao: duracaoTratada,
      preco: dados.preco,
    };

    this.salvando.set(true);

    if (this.servicoId) {
      this.servicoService.atualizar(this.servicoId, payload).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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

    this.servicoService.criar(payload).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
          duracao: this.converterDuracaoParaDate(servico.duracao),
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

  private formatarDuracaoParaBackend(duracao: Date | null): string {
    if (!duracao) {
      throw new Error('A duração do serviço é obrigatória.');
    }

    const horas = duracao.getHours();
    const minutos = duracao.getMinutes();

    if (horas === 0 && minutos === 0) {
      throw new Error('A duração do serviço deve ser maior que zero.');
    }

    if (minutos % 15 !== 0) {
      throw new Error('A duração do serviço deve ser múltipla de 15 minutos.');
    }

    if (horas === 0) {
      return `${minutos} min`;
    }

    if (minutos === 0) {
      return `${horas}h`;
    }

    return `${horas}h ${minutos}min`;
  }

  private converterDuracaoParaDate(duracao: string): Date {
    const valor = duracao.toLowerCase().trim();

    let horas = 0;
    let minutos = 0;

    if (valor.includes('h')) {
      const partesHora = valor.split('h');
      const horasTexto = partesHora[0].replace(/\D/g, '');
      const minutosTexto = partesHora[1]?.replace(/\D/g, '') ?? '';

      horas = horasTexto ? Number(horasTexto) : 0;
      minutos = minutosTexto ? Number(minutosTexto) : 0;
    } else {
      const minutosTexto = valor.replace(/\D/g, '');
      minutos = minutosTexto ? Number(minutosTexto) : 0;
    }

    const data = new Date();
    data.setHours(horas, minutos, 0, 0);

    return data;
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

  private normalizarDuracaoNaGrade(duracao: Date | null): void {
    if (!duracao) {
      return;
    }

    const horas = duracao.getHours();
    const minutos = duracao.getMinutes();

    const minutosNormalizados = Math.round(minutos / 15) * 15;

    let horasFinal = horas;
    let minutosFinal = minutosNormalizados;

    if (minutosFinal === 60) {
      horasFinal += 1;
      minutosFinal = 0;
    }

    const duracaoNormalizada = this.criarDataDuracao(horasFinal, minutosFinal);

    const mesmoValor =
      duracao.getHours() === duracaoNormalizada.getHours() &&
      duracao.getMinutes() === duracaoNormalizada.getMinutes();

    if (mesmoValor) {
      return;
    }

    this.form.controls.duracao.setValue(duracaoNormalizada, {
      emitEvent: false,
    });
  }

  private criarDataDuracao(horas: number, minutos: number): Date {
    const data = new Date();

    data.setHours(horas, minutos, 0, 0);

    return data;
  }
}