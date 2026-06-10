export interface Cliente {
  id: number;
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
  iniciais: string;
  ativo: boolean;
  totalAgendamentos: number;
  totalConcluidos: number;
  totalCancelados: number;
  totalNaoCompareceu: number;
}