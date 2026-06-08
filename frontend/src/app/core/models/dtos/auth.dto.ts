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
  clienteId?: number | null;
  token: string;
}

export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  role: UsuarioRole;
  clienteId?: number | null;
}

export interface CadastroClienteRequest {
  nomeCompleto: string;
  apelido?: string | null;
  email: string;
  whatsapp: string;
  senha: string;
}

export interface GoogleLoginRequest {
  credential: string;
}

export interface GoogleCompletarCadastroRequest {
  credential: string;
  whatsapp: string;
}

export interface GoogleAuthResponse {
  cadastroPendente: boolean;
  nome: string;
  email: string;
  auth?: AuthResponse | null;
}

export interface ValidarEmailRequest {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoEmailRequest {
  email: string;
}

export interface EsqueciSenhaRequest {
  email: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}