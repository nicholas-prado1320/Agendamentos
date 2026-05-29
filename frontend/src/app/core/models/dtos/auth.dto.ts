export type UsuarioRole = 'MANICURE' | 'CLIENTE';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  id: number;
  nome: string;
  email: string;
  role: UsuarioRole;
  token: string;
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  role: UsuarioRole;
}