export interface AgendamentoRequest {
  clienteId: string;
  servicoId: string;
  data: string;
  hora: string;
}

export interface AgendamentoResponse {
  id: string;

  cliente: {
    id: string;
    nomeCompleto: string;
    apelido?: string;
  };

  servico: {
    id: string;
    nome: string;
    preco: number;
  };

  data: string;
  hora: string;
  status: 'Agendado' | 'Concluído' | 'Cancelado';
}