# Configuração do Supabase

Este documento descreve como configurar o banco de dados Supabase para o sistema de agendamento da barbearia.

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados do projeto:
   - Nome do projeto: `barbearia-agendamento`
   - Senha do banco de dados: (escolha uma senha forte)
   - Região: escolha a mais próxima (ex: South America - Barras, PI)
5. Aguarde a criação do projeto (pode levar alguns minutos)

## Passo 2: Obter Credenciais

1. No painel do projeto, vá em **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (URL da API)
   - **anon/public key** (Chave pública)
3. Crie um arquivo `.env.local` na raiz do projeto
4. Cole as credenciais no formato:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

## Passo 3: Criar Tabelas

Execute os seguintes comandos SQL no **SQL Editor** do Supabase:

### Tabela de Clientes

```sql
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices para melhor performance
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
```

### Tabela de Barbeiros

```sql
CREATE TABLE barbeiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  especialidades TEXT[] DEFAULT '{}',
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_barbeiros_ativo ON barbeiros(ativo);
```

### Tabela de Serviços

```sql
CREATE TABLE servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  duracao INTEGER NOT NULL, -- em minutos
  preco DECIMAL(10, 2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices
CREATE INDEX idx_servicos_ativo ON servicos(ativo);
```

### Tabela de Agendamentos

```sql
CREATE TYPE status_agendamento AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado');

CREATE TABLE agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_agendamento DEFAULT 'pendente',
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_barbeiro ON agendamentos(barbeiro_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- Trigger para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_agendamentos
BEFORE UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();
```

### Tabela de Horários Disponíveis

```sql
CREATE TABLE horarios_disponiveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0 = Domingo, 6 = Sábado
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices
CREATE INDEX idx_horarios_barbeiro ON horarios_disponiveis(barbeiro_id);
CREATE INDEX idx_horarios_dia ON horarios_disponiveis(dia_semana);
```

## Passo 4: Inserir Dados Iniciais

Execute os seguintes comandos para popular o banco com dados de exemplo:

```sql
-- Inserir barbeiros
INSERT INTO barbeiros (nome, email, telefone, especialidades) VALUES
('Carlos Silva', 'carlos@barbearia.com', '(86) 98765-4321', ARRAY['Corte Clássico', 'Barba', 'Degradê']),
('Roberto Santos', 'roberto@barbearia.com', '(86) 98765-4322', ARRAY['Corte Moderno', 'Barba', 'Pigmentação']);

-- Inserir serviços
INSERT INTO servicos (nome, descricao, duracao, preco) VALUES
('Corte de Cabelo', 'Corte tradicional ou moderno', 30, 50.00),
('Barba', 'Aparar e modelar a barba', 20, 35.00),
('Corte + Barba', 'Pacote completo', 45, 75.00),
('Pigmentação', 'Pigmentação de barba e cabelo', 40, 60.00),
('Hidratação', 'Tratamento capilar', 25, 40.00);

-- Inserir horários disponíveis (Segunda a Sexta, 9h às 18h)
INSERT INTO horarios_disponiveis (barbeiro_id, dia_semana, hora_inicio, hora_fim)
SELECT 
  b.id,
  dia,
  '09:00'::TIME,
  '18:00'::TIME
FROM barbeiros b
CROSS JOIN generate_series(1, 5) AS dia;

-- Inserir horários de sábado (9h às 14h)
INSERT INTO horarios_disponiveis (barbeiro_id, dia_semana, hora_inicio, hora_fim)
SELECT 
  b.id,
  6,
  '09:00'::TIME,
  '14:00'::TIME
FROM barbeiros b;
```

## Passo 5: Configurar Políticas de Segurança (RLS)

Para permitir acesso público aos dados (ideal para MVP), execute:

```sql
-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponiveis ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
CREATE POLICY "Permitir leitura pública" ON clientes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON clientes FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública" ON barbeiros FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública" ON servicos FOR SELECT USING (true);

CREATE POLICY "Permitir todas operações" ON agendamentos FOR ALL USING (true);
CREATE POLICY "Permitir leitura pública" ON horarios_disponiveis FOR SELECT USING (true);
```

**⚠️ IMPORTANTE:** Em produção, configure políticas de segurança mais restritivas baseadas em autenticação.

## Passo 6: Testar Conexão

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse `http://localhost:3000`
3. Navegue até a página de agendamento
4. Tente criar um novo agendamento
5. Verifique no painel do Supabase se os dados foram salvos

## Funções Úteis do Supabase

### Buscar Horários Disponíveis

```sql
CREATE OR REPLACE FUNCTION buscar_horarios_disponiveis(
  p_barbeiro_id UUID,
  p_data DATE
)
RETURNS TABLE (
  horario TIMESTAMP WITH TIME ZONE,
  disponivel BOOLEAN
) AS $$
DECLARE
  dia_semana_num INTEGER;
  hora_inicio TIME;
  hora_fim TIME;
BEGIN
  -- Obter dia da semana (0 = Domingo)
  dia_semana_num := EXTRACT(DOW FROM p_data);
  
  -- Buscar horários configurados para o barbeiro neste dia
  SELECT hd.hora_inicio, hd.hora_fim
  INTO hora_inicio, hora_fim
  FROM horarios_disponiveis hd
  WHERE hd.barbeiro_id = p_barbeiro_id
    AND hd.dia_semana = dia_semana_num
    AND hd.ativo = TRUE
  LIMIT 1;
  
  -- Se não houver horário configurado, retornar vazio
  IF hora_inicio IS NULL THEN
    RETURN;
  END IF;
  
  -- Gerar slots de 30 minutos
  RETURN QUERY
  WITH slots AS (
    SELECT generate_series(
      (p_data + hora_inicio)::TIMESTAMP WITH TIME ZONE,
      (p_data + hora_fim - INTERVAL '30 minutes')::TIMESTAMP WITH TIME ZONE,
      INTERVAL '30 minutes'
    ) AS slot_horario
  )
  SELECT 
    s.slot_horario,
    NOT EXISTS (
      SELECT 1 
      FROM agendamentos a
      WHERE a.barbeiro_id = p_barbeiro_id
        AND a.data_hora = s.slot_horario
        AND a.status IN ('pendente', 'confirmado')
    ) AS disponivel
  FROM slots s;
END;
$$ LANGUAGE plpgsql;
```

## Próximos Passos

1. **Autenticação**: Implemente autenticação de usuários usando Supabase Auth
2. **Storage**: Configure o Supabase Storage para upload de fotos dos barbeiros
3. **Realtime**: Ative subscriptions para atualizações em tempo real
4. **Backup**: Configure backups automáticos no painel do Supabase

## Suporte

Para mais informações, consulte a [documentação oficial do Supabase](https://supabase.com/docs).
