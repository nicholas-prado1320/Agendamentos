export interface ServicoRequest {
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
}

export interface ServicoResponse {
  id: number;
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
  ativo: boolean;
}