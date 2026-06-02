import { StatusAgendamento } from './dtos/agendamento.dto';

export interface ClienteAgendamento {
  id: number;
  nomeCompleto: string;
  apelido: string;
  iniciais: string;
}

export interface ServicoAgendamento {
  id: number;
  nome: string;
  preco: number;
}

export interface Agendamento {
  id: number;
  cliente: ClienteAgendamento;
  servico: ServicoAgendamento;
  data: string;
  hora: string;
  status: StatusAgendamento;
}