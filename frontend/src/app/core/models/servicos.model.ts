export interface Servico {
  id: number;
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
  ativo: boolean;
}