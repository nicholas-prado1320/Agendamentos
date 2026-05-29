import { ClienteResponse } from '../models/dtos/cliente.dto';
import { Cliente } from '../models/cliente.model';
import { gerarIniciais } from '../utils/cliente.utils';

export function mapClienteResponseToModel(response: ClienteResponse): Cliente {
    return {
        id: response.id,
        nomeCompleto: response.nomeCompleto,
        apelido: response.apelido,
        whatsapp: response.whatsapp,
        ativo: response.ativo,
        iniciais: gerarIniciais(response.nomeCompleto),
    };
}