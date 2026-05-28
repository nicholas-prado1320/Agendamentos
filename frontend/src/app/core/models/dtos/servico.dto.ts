export interface ServicoRequest {
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
}

export interface ServicoResponse {
  id: string;
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
  ativo: boolean;
}