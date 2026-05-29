export interface Cliente {
  id: number;
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
  iniciais: string;
  ativo: boolean;
}