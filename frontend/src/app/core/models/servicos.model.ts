export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  duracao: string;
  preco: number;
  ativo: boolean;
}