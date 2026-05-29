import { AgendamentoResponse } from '../models/dtos/agendamento.dto';
import { Agendamento } from '../models/agendamento.model';
import { gerarIniciais } from '../utils/cliente.utils';

export function mapAgendamentoResponseToModel(response: AgendamentoResponse): Agendamento {
    return {
        id: response.id,
        cliente: {
            id: response.cliente.id,
            nomeCompleto: response.cliente.nomeCompleto,
            apelido: response.cliente.apelido,
            iniciais: gerarIniciais(response.cliente.nomeCompleto),
        },
        servico: {
            id: response.servico.id,
            nome: response.servico.nome,
            preco: response.servico.preco,
        },
        data: response.data,
        hora: response.hora.slice(0, 5),
        status: response.status,
    };
}