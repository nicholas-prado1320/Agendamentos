import { computed, Injectable, signal } from '@angular/core';
import { Servico } from '../models/servicos.model';

export type NovoServicoPayload = Omit<Servico, 'id' | 'ativo'>;
export type EditarServicoPayload = Omit<Servico, 'ativo'>;

@Injectable({
  providedIn: 'root',
})
export class ServicoService {
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
    this.servicosState.update((servicos) =>
      servicos.map((servico) =>
        servico.id === dados.id
          ? {
            ...servico,
            nome: dados.nome,
            descricao: dados.descricao,
            duracao: dados.duracao,
            preco: dados.preco,
          }
          : servico
      )
    );
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