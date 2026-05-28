import { computed, Injectable, signal, inject } from '@angular/core';
import { Servico } from '../models/servicos.model';
import { AgendamentoService } from './agendamento.service';
import { ServicoRequest } from '../models/dtos/servico.dto';

export type NovoServicoPayload = Omit<Servico, 'id' | 'ativo'>;
export type EditarServicoPayload = Omit<Servico, 'ativo'>;

@Injectable({
  providedIn: 'root',
})
export class ServicoService {
  private readonly agendamentoService = inject(AgendamentoService);

  private readonly servicosState = signal<Servico[]>([
    {
      id: '1',
      nome: 'Manicure tradicional',
      descricao: 'Cutilagem e esmaltação simples.',
      duracao: '1h',
      preco: 35,
      ativo: true,
    },
    {
      id: '2',
      nome: 'Pedicure tradicional',
      descricao: 'Cutilagem, esmaltação e hidratação.',
      duracao: '1h',
      preco: 40,
      ativo: true,
    },
    {
      id: '3',
      nome: 'Esmaltação em gel',
      descricao: 'Esmaltação de alta durabilidade com secagem em cabine UV.',
      duracao: '1h 30min',
      preco: 70,
      ativo: true,
    },
    {
      id: '4',
      nome: 'Manicure + Alongamento',
      descricao: 'Alongamento em fibra de vidro ou gel.',
      duracao: '2h 30min',
      preco: 120,
      ativo: true,
    },
  ]);

  readonly servicos = this.servicosState.asReadonly();

  readonly servicosAtivos = computed(() => {
    return this.servicosState().filter((servico) => servico.ativo);
  });

  listar(): Servico[] {
    return this.servicosState();
  }

  criar(payload: ServicoRequest): void {
    this.adicionarServico(payload);
  }

  atualizar(id: string, payload: ServicoRequest): void {
    this.editarServico({
      id,
      ...payload,
    });
  }

  buscarPorId(id: string): Servico | undefined {
    return this.servicosState().find((servico) => servico.id === id);
  }

  adicionarServico(dados: NovoServicoPayload): void {
    const novoServico: Servico = {
      ...dados,
      id: crypto.randomUUID(),
      ativo: true,
    };

    this.servicosState.update((servicos) => [...servicos, novoServico]);
  }

  editarServico(dados: EditarServicoPayload): void {
    const servicoAtualizado: Servico = {
      ...dados,
      ativo: this.buscarPorId(dados.id)?.ativo ?? true,
    };
    this.servicosState.update((servicos) =>
      servicos.map((servico) => (servico.id === dados.id ? servicoAtualizado : servico))
    );
    this.agendamentoService.atualizarServicoNosAgendamentos({
      id: servicoAtualizado.id,
      nome: servicoAtualizado.nome,
      preco: servicoAtualizado.preco,
    });
  }

  inativarServico(id: string): void {
    this.servicosState.update((servicos) =>
      servicos.map((servico) =>
        servico.id === id
          ? {
            ...servico,
            ativo: false,
          }
          : servico
      )
    );
  }

  ativarServico(id: string): void {
    this.servicosState.update((servicos) =>
      servicos.map((servico) =>
        servico.id === id
          ? {
            ...servico,
            ativo: true,
          }
          : servico
      )
    );
  }
}