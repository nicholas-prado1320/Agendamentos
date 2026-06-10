export interface ClienteRequest {
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
}

export interface ClienteResponse {
  id: number;
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
  ativo: boolean;
  totalAgendamentos: number;
  totalConcluidos: number;
  totalCancelados: number;
  totalNaoCompareceu: number;
}