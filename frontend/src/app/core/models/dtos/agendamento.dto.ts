export type StatusAgendamento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';

export interface AgendamentoRequest {
  clienteId: number | undefined;
  servicoId: number;
  data: string;
  hora: string;
}

export interface AgendamentoResponse {
  id: number;
  cliente: {
    id: number;
    nomeCompleto: string;
    apelido?: string;
  };
  servico: {
    id: number;
    nome: string;
    preco: number;
  };
  data: string;
  hora: string;
  status: StatusAgendamento;
}