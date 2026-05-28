export interface ClienteRequest {
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
}

export interface ClienteResponse {
  id: string;
  nomeCompleto: string;
  apelido?: string;
  whatsapp: string;
}