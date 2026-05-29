import { Cliente } from './cliente.model';
import { Servico } from './servicos.model';

export type StatusAgendamento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';

export type ClienteAgendamento = Pick<Cliente,'id' | 'nomeCompleto' | 'apelido' | 'iniciais'>;

export type ServicoAgendamento = Pick<Servico, 'id' | 'nome' | 'preco'>;

export interface Agendamento {
  id: number;
  cliente: ClienteAgendamento;
  servico: ServicoAgendamento;
  data: string;
  hora: string;
  status: StatusAgendamento;
}