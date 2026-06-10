export type StatusAgendamento = 'AGENDADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU' | 'EXCLUIDO';

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

export interface AgendamentoFiltroParams {
  tipo?: 'HOJE' | 'SEMANA' | 'TODOS' | 'HISTORICO' | 'PENDENCIAS';
  status?: StatusAgendamento;
  todosStatus?: boolean;
  clienteId?: number;
  servicoId?: number;
  dataInicio?: string;
  dataFim?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  busca?: string;
  page: number;
  size: number;
}