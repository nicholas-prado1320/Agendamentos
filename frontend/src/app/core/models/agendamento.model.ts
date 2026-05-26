export interface Agendamento {
  id: string;
  clienteId: string;
  data: string;
  hora: string;
  servico: string;
  status: 'Agendado' | 'Concluído' | 'Cancelado';
}