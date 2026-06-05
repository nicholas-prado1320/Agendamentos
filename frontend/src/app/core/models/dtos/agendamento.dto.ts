export type StatusAgendamento = 'AGENDADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'EXCLUIDO';

export interface AgendamentoRequest {
  clienteId: number;
  servicoId: number;
  data: string;
  hora: string;
}

export interface AgendamentoResponse {
  id: number;
  cliente: {
    id: number;
    nomeCompleto: string;
    apelido?: string | null;
  };
  servico: {
    id: number;
    nome: string;
    preco: number;
    duracao?: string;
  };
  data: string;
  hora: string;
  status: StatusAgendamento;
}

export interface HorarioDisponivelResponse {
  hora: string;
  disponivel: boolean;
}