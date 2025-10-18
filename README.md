# 💈 Barbearia Premium

Sistema completo de agendamento desenvolvido com Next.js, TypeScript e Supabase.

## Recursos Principais

- Interface moderna com tema claro e escuro
- Sistema de agendamento em 4 etapas
- Dashboard para gerenciar horários
- Configuração de barbeiros, serviços e horários
- Totalmente responsivo
- Integração com Supabase

## Tecnologias

- Next.js 15.5
- React 19
- TypeScript
- Tailwind CSS 3.4
- Radix UI
- Framer Motion
- Supabase
- date-fns

## Como Usar

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

3. Configure o banco de dados seguindo as instruções em `SUPABASE_SETUP.md`

4. Inicie o servidor:
```bash
npm run dev
```

5. Acesse http://localhost:3000

## Estrutura

```
barbearia/
├── app/                    # Páginas da aplicação
│   ├── agendamento/       # Tela de agendamento
│   ├── dashboard/         # Painel de controle
│   └── configuracoes/     # Configurações
├── components/            # Componentes reutilizáveis
├── contexts/              # Contextos React
├── lib/                   # Utilitários e configurações
└── types/                 # Definições TypeScript
```

## Funcionalidades

### Área Pública
- **Página Inicial**: Apresentação da barbearia com design moderno
- **Agendamento**: Sistema completo em 4 etapas
  - Seleção de barbeiro e serviço
  - Escolha de data e horário
  - Preenchimento de dados do cliente
  - Confirmação do agendamento

### Área Administrativa (Protegida)
- **Login**: Autenticação para acesso restrito
- **Dashboard Profissional**:
  - Estatísticas em tempo real
  - Visualização de agendamentos por período
  - Filtros avançados e busca
  - Ações rápidas (confirmar, cancelar, concluir)
  - Exportação de dados
  - Métricas de receita e clientes
- **Configurações**:
  - Cadastro e gerenciamento de barbeiros
  - Catálogo de serviços
  - Definição de horários de funcionamento
  - Controle de comissões

## Credenciais de Teste

Para acessar a área administrativa:
- **Email**: admin@barbearia.com
- **Senha**: admin123

## Banco de Dados

Execute o arquivo `supabase-schema.sql` no SQL Editor do Supabase para criar:
- Tabelas completas com relacionamentos
- Triggers automáticos
- Funções úteis para consultas
- Políticas de segurança (RLS)
- Views para relatórios
- Dados iniciais de exemplo

## Suporte

Para configurar o Supabase, consulte o arquivo `SUPABASE_SETUP.md`.
