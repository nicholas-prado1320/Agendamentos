# Peony Beauty

Sistema web/PWA para gestão de agendamentos em salão de beleza, desenvolvido com foco em responsividade, experiência mobile first, autenticação segura e organização da rotina de atendimento.

O projeto permite que clientes realizem agendamentos de serviços e que a profissional responsável gerencie clientes, serviços, horários de atendimento, bloqueios de agenda, status dos atendimentos, pendências e histórico.

> Projeto em desenvolvimento, utilizado como case full stack com preparação para ambiente de produção.

---

## Funcionalidades

### Autenticação e usuários

- Cadastro de usuários
- Login com e-mail e senha
- Login com Google OAuth
- Validação de e-mail por código
- Reenvio de código de validação
- Recuperação de senha
- Alteração de senha autenticada
- Controle de perfis de acesso:
  - Cliente
  - Manicure

### Gestão de clientes

- Cadastro de clientes
- Edição de dados do cliente
- Consulta de clientes cadastrados
- Vínculo entre usuário e cliente
- Controle de clientes ativos

### Gestão de serviços

- Cadastro de serviços
- Edição de serviços
- Controle de preço
- Controle de duração do serviço
- Ativação e inativação de serviços

### Gestão de horários

- Cadastro de horários de atendimento
- Configuração por dia da semana
- Atendimento 24h
- Validação de disponibilidade conforme duração do serviço
- Bloqueios de agenda por período
- Bloqueios de dia inteiro ou por horário específico

### Agendamentos

- Criação de agendamentos pelo cliente
- Criação de agendamentos pela manicure
- Listagem de agendamentos do dia
- Histórico de agendamentos
- Cancelamento de agendamentos
- Controle de status:
  - Agendado
  - Em atendimento
  - Concluído
  - Cancelado
  - Não compareceu
- Detecção de pendências de atendimentos passados
- Filtros por status, data, cliente e serviço
- Paginação de resultados

### PWA

- Instalação como aplicativo no celular
- Suporte a Android
- Instrução personalizada para instalação no iPhone
- Service Worker
- Manifest configurado
- Experiência mobile first

### Segurança

- Autenticação com JWT
- Proteção de rotas no frontend
- Proteção de endpoints no backend
- Controle de autorização por perfil
- Validação de permissões no backend
- CORS configurável por ambiente
- Variáveis sensíveis fora do código-fonte
- Separação entre ambiente de desenvolvimento e produção

---

## Tecnologias utilizadas

### Frontend

- Angular
- TypeScript
- PrimeNG
- SCSS
- Angular PWA
- Service Worker
- Google OAuth

### Backend

- Java
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- Bean Validation
- API REST

### Banco de dados

- PostgreSQL

### Infraestrutura e ferramentas

- Docker
- Docker Compose
- Nginx
- Cloudflare Tunnel para testes externos
- Postman
- DBeaver
- Git e GitHub

---

## Arquitetura do projeto

```txt
Agendamentos
├── backend
│   ├── src
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend
│   ├── src
│   ├── public
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
