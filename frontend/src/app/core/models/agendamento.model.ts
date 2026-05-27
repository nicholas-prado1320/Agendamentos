import { Cliente } from './cliente.model';
import { Servico } from './servicos.model';

export type StatusAgendamento = 'Agendado' | 'Concluído' | 'Cancelado';

export type ClienteAgendamento = Pick<Cliente, 'id' | 'nomeCompleto' | 'apelido' | 'iniciais'>;

export type ServicoAgendamento = Pick<Servico, 'id' | 'nome' | 'preco'>;

export interface Agendamento {
  id: string;
  cliente: ClienteAgendamento;
  servico: ServicoAgendamento;
  data: string;
  hora: string;
  status: StatusAgendamento;
}