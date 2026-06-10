import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';

import { AgendamentoService } from '../../core/service/agendamento.service';
import { ClienteService } from '../../core/service/cliente.service';
import { ServicoService } from '../../core/service/servicos.service';
import { AppDrawerComponent } from '../../shared/app-drawer/app-drawer';
import { Agendamento } from '../../core/models/agendamento.model';
import { mapAgendamentoResponseToModel } from '../../core/mappers/agendamento.mapper';
import { DialogService } from '../../core/service/dialog.service';
import { AuthService } from '../../core/service/auth.service';
import { ApiErrorResponse } from '../../core/models/dtos/api-error.dto';
import { StatusAgendamento } from '../../core/models/dtos/agendamento.dto';

type FiltroAgendamento = '' | 'hoje' | 'semana' | 'todos' | 'historico' | 'pendencias';
type TipoFiltroApi = 'HOJE' | 'SEMANA' | 'TODOS' | 'HISTORICO' | 'PENDENCIAS';
type StatusFiltro = StatusAgendamento | 'TODOS_STATUS';

@Component({
  selector: 'app-agendamentos',
  imports: [
    RouterModule,
    FormsModule,
    AccordionModule,
    ButtonModule,
    DatePickerModule,
    FloatLabelModule,
    InputNumberModule,
    InputTextModule,
    PaginatorModule,
    SelectModule,
    AppDrawerComponent,
  ],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Agendamentos {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly dialogService = inject(DialogService);
  private readonly clienteService = inject(ClienteService);
  private readonly servicoService = inject(ServicoService);

  public readonly authService = inject(AuthService);

  public readonly filtroSelecionado = signal<FiltroAgendamento>('hoje');
  public readonly agendamentos = signal<Agendamento[]>([]);
  public readonly carregando = signal(false);

  public readonly busca = signal('');
  public readonly statusFiltro = signal<StatusFiltro>('TODOS_STATUS');
  public readonly clienteIdFiltro = signal<number | null>(null);
  public readonly servicoIdFiltro = signal<number | null>(null);
  public readonly dataInicioFiltro = signal<Date | null>(null);
  public readonly dataFimFiltro = signal<Date | null>(null);
  public readonly valorMinimoFiltro = signal<number | null>(null);
  public readonly valorMaximoFiltro = signal<number | null>(null);

  public readonly pagina = signal(0);
  public readonly tamanhoPagina = signal(5);
  public readonly totalRegistros = signal(0);

  public readonly clientesFiltro = signal<{ label: string; value: number }[]>([]);
  public readonly servicosFiltro = signal<{ label: string; value: number }[]>([]);

  menuAberto = false;

  public readonly filtros: { label: string; value: FiltroAgendamento }[] = [
    { label: 'Hoje', value: 'hoje' },
    { label: 'Semana', value: 'semana' },
    { label: 'Todos', value: 'todos' },
    { label: 'Histórico', value: 'historico' },
    { label: 'Pendências', value: 'pendencias' },
  ];

  public readonly statusOptions: { label: string; value: StatusFiltro }[] = [
    { label: 'Todos os status', value: 'TODOS_STATUS' },
    { label: 'Agendado', value: 'AGENDADO' },
    { label: 'Em atendimento', value: 'EM_ATENDIMENTO' },
    { label: 'Concluído', value: 'CONCLUIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Não compareceu', value: 'NAO_COMPARECEU' },
    { label: 'Excluído', value: 'EXCLUIDO' },
  ];

  public readonly agendamentosFiltrados = computed(() => {
    return [...this.agendamentos()].sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`).getTime();
      const dataHoraB = new Date(`${b.data}T${b.hora}`).getTime();

      return dataHoraA - dataHoraB;
    });
  });

  public readonly primeiroRegistro = computed(() => this.pagina() * this.tamanhoPagina());

  public readonly modoCompacto = computed(() =>
    this.filtroSelecionado() === 'todos' ||
    this.filtroSelecionado() === 'historico' ||
    this.filtroSelecionado() === 'pendencias'
  );

  constructor() {
    this.carregarOpcoesFiltros();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filtro = params.get('filtro');

      if (filtro === 'hoje' || filtro === 'semana' || filtro === 'todos' || filtro === 'historico' || filtro === 'pendencias') {
        this.filtroSelecionado.set(filtro);
      } else {
        this.filtroSelecionado.set('hoje');
      }

      this.pagina.set(0);
      this.carregarAgendamentos();
    });
  }

  abrirMenu(): void {
    this.menuAberto = true;
  }

  alterarFiltro(filtro: FiltroAgendamento): void {
    this.filtroSelecionado.set(filtro);
    this.pagina.set(0);

    this.router.navigate(['/agendamentos'], {
      queryParams: {
        filtro,
      },
    });
  }

  buscarAgendamentos(): void {
    this.pagina.set(0);
    this.carregarAgendamentos();
  }

  limparFiltrosAvancados(): void {
    this.busca.set('');
    this.statusFiltro.set('TODOS_STATUS');
    this.clienteIdFiltro.set(null);
    this.servicoIdFiltro.set(null);
    this.dataInicioFiltro.set(null);
    this.dataFimFiltro.set(null);
    this.valorMinimoFiltro.set(null);
    this.valorMaximoFiltro.set(null);
    this.pagina.set(0);
    this.carregarAgendamentos();
  }

  alterarStatusFiltro(valor: StatusFiltro): void {
    this.statusFiltro.set(valor);
    this.buscarAgendamentos();
  }

  alterarClienteFiltro(valor: number | null): void {
    this.clienteIdFiltro.set(valor);
    this.buscarAgendamentos();
  }

  alterarServicoFiltro(valor: number | null): void {
    this.servicoIdFiltro.set(valor);
    this.buscarAgendamentos();
  }

  alterarDataInicio(valor: Date | null): void {
    this.dataInicioFiltro.set(valor);
    this.buscarAgendamentos();
  }

  alterarDataFim(valor: Date | null): void {
    this.dataFimFiltro.set(valor);
    this.buscarAgendamentos();
  }

  alterarValorMinimo(valor: number | null): void {
    this.valorMinimoFiltro.set(valor);
  }

  alterarValorMaximo(valor: number | null): void {
    this.valorMaximoFiltro.set(valor);
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.pagina.set(event.page ?? 0);
    this.tamanhoPagina.set(event.rows ?? 5);
    this.carregarAgendamentos();
  }

  novoAgendamento(): void {
    this.router.navigate(['/novo-agendamento']);
  }

  iniciarAgendamento(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Iniciar atendimento',
      message: 'Deseja iniciar este atendimento?',
      icon: 'pi pi-play-circle',
      acceptLabel: 'Sim, iniciar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.agendamentoService.iniciar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (agendamentoAtualizado) => {
            const agendamento = mapAgendamentoResponseToModel(agendamentoAtualizado);

            this.agendamentos.update((agendamentos) => agendamentos.map((item) => (item.id === id ? agendamento : item)));
            this.dialogService.success('Atendimento iniciado com sucesso.', 'Atendimento iniciado');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  concluirAgendamento(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Concluir agendamento',
      message: 'Deseja marcar este agendamento como concluído?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sim, concluir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.agendamentoService.concluir(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.carregarAgendamentos();
            this.dialogService.success('O agendamento foi concluído com sucesso.', 'Agendamento concluído');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  marcarNaoCompareceu(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Cliente não compareceu',
      message: 'Deseja marcar este atendimento como não comparecido?',
      icon: 'pi pi-user-minus',
      acceptLabel: 'Sim, marcar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.agendamentoService.naoCompareceu(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.carregarAgendamentos();
            this.dialogService.success('Atendimento marcado como não comparecido.', 'Status atualizado');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  cancelarAgendamento(id: number): void {
    this.dialogService.confirmDialog({
      header: 'Cancelar agendamento',
      message: 'Deseja cancelar este agendamento?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Voltar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.agendamentoService.cancelar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.carregarAgendamentos();
            this.dialogService.success('O agendamento foi cancelado com sucesso.', 'Agendamento cancelado');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  removerAgendamento(id: number): void {
    if (this.authService.isCliente()) {
      return;
    }

    this.dialogService.confirmDialog({
      header: 'Remover agendamento',
      message: 'Deseja remover este agendamento? Ele será enviado para o histórico.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.agendamentoService.remover(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.carregarAgendamentos();
            this.dialogService.success('Agendamento removido com sucesso.', 'Agendamento removido');
          },
          error: (error: HttpErrorResponse) => {
            this.dialogService.error(this.extrairMensagemErro(error));
          },
        });
      },
    });
  }

  podeIniciar(agendamento: Agendamento): boolean {
    return this.authService.isManicure()
      && agendamento.status === 'AGENDADO'
      && this.agendamentoJaPodeIniciar(agendamento)
      && !this.agendamentoPassouDoFimPrevisto(agendamento)
      && this.filtroSelecionado() !== 'historico';
  }

  podeConcluir(agendamento: Agendamento): boolean {
    return this.authService.isManicure()
      && this.filtroSelecionado() !== 'historico'
      && (
        agendamento.status === 'EM_ATENDIMENTO'
        || (agendamento.status === 'AGENDADO' && this.agendamentoPassouDoFimPrevisto(agendamento))
      );
  }

  podeMarcarNaoCompareceu(agendamento: Agendamento): boolean {
    return this.authService.isManicure()
      && agendamento.status === 'AGENDADO'
      && this.agendamentoPassouDoFimPrevisto(agendamento)
      && this.filtroSelecionado() !== 'historico';
  }

  podeCancelar(status: string): boolean {
    return status === 'AGENDADO' && this.filtroSelecionado() !== 'historico';
  }

  podeRemover(): boolean {
    return this.authService.isManicure() && this.filtroSelecionado() !== 'historico';
  }

  formatarData(dataIso: string): string {
    if (!dataIso) {
      return '';
    }

    const partes = dataIso.split('-');

    if (partes.length !== 3) {
      return dataIso;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      AGENDADO: 'Agendado',
      EM_ATENDIMENTO: 'Em atendimento',
      CONCLUIDO: 'Concluído',
      CANCELADO: 'Cancelado',
      NAO_COMPARECEU: 'Não compareceu',
      EXCLUIDO: 'Excluído',
    };

    return statusMap[status] ?? status;
  }

  obterClasseStatus(status: string): string {
    const classes: Record<string, string> = {
      AGENDADO: 'status-pill',
      EM_ATENDIMENTO: 'status-pill in-progress',
      CONCLUIDO: 'status-pill done',
      CANCELADO: 'status-pill canceled',
      NAO_COMPARECEU: 'status-pill no-show',
      EXCLUIDO: 'status-pill deleted',
    };

    return classes[status] ?? 'status-pill';
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private obterTipoApi(): TipoFiltroApi {
    const filtro = this.filtroSelecionado();
    const possuiPeriodoManual = !!this.dataInicioFiltro() || !!this.dataFimFiltro();

    if (possuiPeriodoManual && (filtro === 'hoje' || filtro === 'semana')) {
      return 'TODOS';
    }

    switch (filtro) {
      case 'hoje':
        return 'HOJE';

      case 'semana':
        return 'SEMANA';

      case 'historico':
        return 'HISTORICO';

      case 'pendencias':
        return 'PENDENCIAS';

      case 'todos':
      default:
        return 'TODOS';
    }
  }

  private obterStatusApi(): StatusAgendamento | undefined {
    const status = this.statusFiltro();

    if (status === 'TODOS_STATUS') {
      return undefined;
    }

    return status;
  }

  private carregarOpcoesFiltros(): void {
    this.clienteService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clientes) => {
          this.clientesFiltro.set(
            clientes.map((cliente) => ({
              label: cliente.nomeCompleto,
              value: cliente.id,
            }))
          );
        },
      });

    this.servicoService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (servicos) => {
          this.servicosFiltro.set(
            servicos.map((servico) => ({
              label: servico.nome,
              value: servico.id,
            }))
          );
        },
      });
  }

  private carregarAgendamentos(): void {
    this.carregando.set(true);

    this.agendamentoService
      .listarFiltrado({
        tipo: this.obterTipoApi(),
        status: this.obterStatusApi(),
        todosStatus: this.statusFiltro() === 'TODOS_STATUS',
        clienteId: this.clienteIdFiltro() ?? undefined,
        servicoId: this.servicoIdFiltro() ?? undefined,
        dataInicio: this.formatarDataParaApi(this.dataInicioFiltro()),
        dataFim: this.formatarDataParaApi(this.dataFimFiltro()),
        valorMinimo: this.valorMinimoFiltro() ?? undefined,
        valorMaximo: this.valorMaximoFiltro() ?? undefined,
        busca: this.busca() || undefined,
        page: this.pagina(),
        size: this.tamanhoPagina(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.agendamentos.set(pagina.content.map(mapAgendamentoResponseToModel));
          this.totalRegistros.set(pagina.totalElements);
          this.pagina.set(pagina.page);
          this.tamanhoPagina.set(pagina.size);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.dialogService.error('Não foi possível carregar os agendamentos.');
        },
      });
  }

  private formatarDataParaApi(data: Date | null): string | undefined {
    if (!data) {
      return undefined;
    }

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private agendamentoPassouDoFimPrevisto(agendamento: Agendamento): boolean {
    const duracao = agendamento.servico.duracao;

    if (!duracao) {
      return false;
    }

    const inicio = new Date(`${agendamento.data}T${agendamento.hora}`);
    const fim = new Date(inicio.getTime() + this.converterDuracaoParaMinutos(duracao) * 60_000);

    return new Date().getTime() > fim.getTime();
  }

  private agendamentoJaPodeIniciar(agendamento: Agendamento): boolean {
    const inicio = new Date(`${agendamento.data}T${agendamento.hora}`);

    return new Date().getTime() >= inicio.getTime();
  }

  private converterDuracaoParaMinutos(duracao: string): number {
    const valor = duracao.toLowerCase().trim();

    if (valor.includes('h')) {
      const partesHora = valor.split('h');
      const horasTexto = partesHora[0].replace(/\D/g, '');
      const minutosTexto = partesHora[1]?.replace(/\D/g, '') ?? '';

      const horas = horasTexto ? Number(horasTexto) : 0;
      const minutos = minutosTexto ? Number(minutosTexto) : 0;

      return horas * 60 + minutos;
    }

    const minutosTexto = valor.replace(/\D/g, '');

    return minutosTexto ? Number(minutosTexto) : 0;
  }

  private extrairMensagemErro(error: HttpErrorResponse): string {
    const apiError = error.error as ApiErrorResponse | undefined;

    if (apiError?.details?.length) {
      return apiError.details.join('\n');
    }

    if (apiError?.message) {
      return apiError.message;
    }

    return 'Não foi possível realizar esta ação.';
  }
}