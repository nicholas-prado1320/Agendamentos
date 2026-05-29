import { ServicoResponse } from '../models/dtos/servico.dto';
import { Servico } from '../models/servicos.model';

export function mapServicoResponseToModel(response: ServicoResponse): Servico {
    return {
        id: response.id,
        nome: response.nome,
        descricao: response.descricao,
        duracao: response.duracao,
        preco: response.preco,
        ativo: response.ativo,
    };
}