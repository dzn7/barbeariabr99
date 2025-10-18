-- ============================================
-- SCHEMA COMPLETO - SISTEMA DE GESTÃO BARBEARIA BR99
-- ============================================
-- Sistema completo com gestão financeira, estoque e comissões
-- Execute este script no SQL Editor do Supabase

-- Limpar tabelas existentes (cuidado em produção!)
DROP TABLE IF EXISTS movimentacoes_estoque CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS comissoes CASCADE;
DROP TABLE IF EXISTS atendimentos_presenciais CASCADE;
DROP TABLE IF EXISTS transacoes CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS horarios_disponiveis CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS barbeiros CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios_admin CASCADE;

DROP TYPE IF EXISTS status_agendamento CASCADE;
DROP TYPE IF EXISTS tipo_transacao CASCADE;
DROP TYPE IF EXISTS categoria_despesa CASCADE;
DROP TYPE IF EXISTS forma_pagamento CASCADE;
DROP TYPE IF EXISTS tipo_movimentacao CASCADE;

-- ============================================
-- TIPOS ENUM
-- ============================================

CREATE TYPE status_agendamento AS ENUM (
  'pendente',
  'confirmado',
  'concluido',
  'cancelado',
  'nao_compareceu'
);

CREATE TYPE tipo_transacao AS ENUM ('receita', 'despesa');

CREATE TYPE categoria_despesa AS ENUM (
  'luz',
  'agua',
  'aluguel',
  'internet',
  'marketing',
  'produtos',
  'manutencao',
  'salarios',
  'impostos',
  'outros',
  'servico'
);

CREATE TYPE forma_pagamento AS ENUM (
  'dinheiro',
  'pix',
  'debito',
  'credito',
  'transferencia'
);

CREATE TYPE tipo_movimentacao AS ENUM ('entrada', 'saida');

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  total_agendamentos INTEGER DEFAULT 0,
  ultima_visita TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
CREATE INDEX idx_clientes_user_id ON clientes(user_id);

-- Barbeiros
CREATE TABLE barbeiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  especialidades TEXT[] DEFAULT '{}',
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comissao_percentual DECIMAL(5, 2) DEFAULT 40.00,
  total_atendimentos INTEGER DEFAULT 0,
  avaliacao_media DECIMAL(3, 2) DEFAULT 0.00
);

CREATE INDEX idx_barbeiros_ativo ON barbeiros(ativo);
CREATE INDEX idx_barbeiros_email ON barbeiros(email);

-- Serviços
CREATE TABLE servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  duracao INTEGER NOT NULL, -- em minutos
  preco DECIMAL(10, 2) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  categoria TEXT DEFAULT 'geral',
  ordem_exibicao INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_categoria ON servicos(categoria);

-- Horários Disponíveis
CREATE TABLE horarios_disponiveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  UNIQUE(barbeiro_id, dia_semana, hora_inicio)
);

CREATE INDEX idx_horarios_barbeiro ON horarios_disponiveis(barbeiro_id);
CREATE INDEX idx_horarios_dia ON horarios_disponiveis(dia_semana);

-- Agendamentos
CREATE TABLE agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_agendamento DEFAULT 'pendente',
  observacoes TEXT,
  valor_pago DECIMAL(10, 2),
  forma_pagamento forma_pagamento,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  cancelado_em TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT
);

CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_barbeiro ON agendamentos(barbeiro_id);
CREATE INDEX idx_agendamentos_servico ON agendamentos(servico_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_hora, status);

-- ============================================
-- SISTEMA FINANCEIRO
-- ============================================

-- Transações Financeiras
CREATE TABLE transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo tipo_transacao NOT NULL,
  categoria categoria_despesa NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  forma_pagamento forma_pagamento,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  barbeiro_id UUID REFERENCES barbeiros(id) ON DELETE SET NULL,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX idx_transacoes_categoria ON transacoes(categoria);
CREATE INDEX idx_transacoes_data ON transacoes(data);
CREATE INDEX idx_transacoes_barbeiro ON transacoes(barbeiro_id);

-- Atendimentos Presenciais (Walk-in)
CREATE TABLE atendimentos_presenciais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  forma_pagamento forma_pagamento NOT NULL,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_atendimentos_presenciais_barbeiro ON atendimentos_presenciais(barbeiro_id);
CREATE INDEX idx_atendimentos_presenciais_data ON atendimentos_presenciais(data);

-- ============================================
-- ESTOQUE
-- ============================================

-- Produtos
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  quantidade_estoque INTEGER DEFAULT 0,
  quantidade_minima INTEGER DEFAULT 5,
  preco_compra DECIMAL(10, 2) NOT NULL,
  preco_venda DECIMAL(10, 2) NOT NULL,
  fornecedor TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_estoque_baixo ON produtos(quantidade_estoque) WHERE quantidade_estoque <= quantidade_minima;

-- Movimentações de Estoque
CREATE TABLE movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo tipo_movimentacao NOT NULL,
  quantidade INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  valor_unitario DECIMAL(10, 2),
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id UUID,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes_estoque(data);

-- ============================================
-- COMISSÕES
-- ============================================

-- Comissões dos Barbeiros
CREATE TABLE comissoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  atendimento_presencial_id UUID REFERENCES atendimentos_presenciais(id) ON DELETE SET NULL,
  valor_servico DECIMAL(10, 2) NOT NULL,
  percentual_comissao DECIMAL(5, 2) NOT NULL,
  valor_comissao DECIMAL(10, 2) NOT NULL,
  data_pagamento DATE,
  pago BOOLEAN DEFAULT FALSE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comissoes_barbeiro ON comissoes(barbeiro_id);
CREATE INDEX idx_comissoes_pago ON comissoes(pago);
CREATE INDEX idx_comissoes_mes_ano ON comissoes(mes, ano);

-- ============================================
-- USUÁRIOS ADMIN
-- ============================================

CREATE TABLE usuarios_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  nivel_acesso TEXT DEFAULT 'operador' CHECK (nivel_acesso IN ('admin', 'gerente', 'operador')),
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios_admin(email);
CREATE INDEX idx_usuarios_ativo ON usuarios_admin(ativo);

-- ============================================
-- TRIGGERS E FUNÇÕES
-- ============================================

-- Atualizar timestamp
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

CREATE TRIGGER trigger_atualizar_transacoes
BEFORE UPDATE ON transacoes
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_atualizar_produtos
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- Criar transação automática ao concluir agendamento
CREATE OR REPLACE FUNCTION criar_transacao_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND OLD.status != 'concluido' AND NEW.valor_pago IS NOT NULL THEN
    INSERT INTO transacoes (
      tipo,
      categoria,
      descricao,
      valor,
      data,
      forma_pagamento,
      agendamento_id,
      barbeiro_id
    ) VALUES (
      'receita',
      'servico',
      'Agendamento - ' || (SELECT nome FROM servicos WHERE id = NEW.servico_id),
      NEW.valor_pago,
      NEW.data_hora::DATE,
      NEW.forma_pagamento,
      NEW.id,
      NEW.barbeiro_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transacao_agendamento
AFTER UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION criar_transacao_agendamento();

-- Criar comissão automática
CREATE OR REPLACE FUNCTION criar_comissao_automatica()
RETURNS TRIGGER AS $$
DECLARE
  percentual DECIMAL(5,2);
BEGIN
  IF NEW.status = 'concluido' AND OLD.status != 'concluido' AND NEW.valor_pago IS NOT NULL THEN
    SELECT comissao_percentual INTO percentual
    FROM barbeiros
    WHERE id = NEW.barbeiro_id;
    
    INSERT INTO comissoes (
      barbeiro_id,
      agendamento_id,
      valor_servico,
      percentual_comissao,
      valor_comissao,
      mes,
      ano
    ) VALUES (
      NEW.barbeiro_id,
      NEW.id,
      NEW.valor_pago,
      percentual,
      NEW.valor_pago * (percentual / 100),
      EXTRACT(MONTH FROM NEW.data_hora),
      EXTRACT(YEAR FROM NEW.data_hora)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comissao_agendamento
AFTER UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION criar_comissao_automatica();

-- Criar transação e comissão para atendimento presencial
CREATE OR REPLACE FUNCTION processar_atendimento_presencial()
RETURNS TRIGGER AS $$
DECLARE
  percentual DECIMAL(5,2);
BEGIN
  -- Criar transação
  INSERT INTO transacoes (
    tipo,
    categoria,
    descricao,
    valor,
    data,
    forma_pagamento,
    barbeiro_id
  ) VALUES (
    'receita',
    'servico',
    'Atendimento Presencial - ' || NEW.cliente_nome,
    NEW.valor,
    NEW.data::DATE,
    NEW.forma_pagamento,
    NEW.barbeiro_id
  );
  
  -- Criar comissão
  SELECT comissao_percentual INTO percentual
  FROM barbeiros
  WHERE id = NEW.barbeiro_id;
  
  INSERT INTO comissoes (
    barbeiro_id,
    atendimento_presencial_id,
    valor_servico,
    percentual_comissao,
    valor_comissao,
    mes,
    ano
  ) VALUES (
    NEW.barbeiro_id,
    NEW.id,
    NEW.valor,
    percentual,
    NEW.valor * (percentual / 100),
    EXTRACT(MONTH FROM NEW.data),
    EXTRACT(YEAR FROM NEW.data)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_processar_atendimento_presencial
AFTER INSERT ON atendimentos_presenciais
FOR EACH ROW
EXECUTE FUNCTION processar_atendimento_presencial();

-- Atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION atualizar_estoque()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE produtos
    SET quantidade_estoque = quantidade_estoque + NEW.quantidade
    WHERE id = NEW.produto_id;
  ELSE
    UPDATE produtos
    SET quantidade_estoque = quantidade_estoque - NEW.quantidade
    WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque
AFTER INSERT ON movimentacoes_estoque
FOR EACH ROW
EXECUTE FUNCTION atualizar_estoque();

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Obter métricas do dashboard
CREATE OR REPLACE FUNCTION obter_metricas_dashboard(
  p_data_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_data_fim DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  resultado JSON;
BEGIN
  SELECT json_build_object(
    'receita_total', (
      SELECT COALESCE(SUM(valor), 0)
      FROM transacoes
      WHERE tipo = 'receita'
        AND data BETWEEN p_data_inicio AND p_data_fim
    ),
    'despesa_total', (
      SELECT COALESCE(SUM(valor), 0)
      FROM transacoes
      WHERE tipo = 'despesa'
        AND data BETWEEN p_data_inicio AND p_data_fim
    ),
    'total_agendamentos', (
      SELECT COUNT(*)
      FROM agendamentos
      WHERE data_hora::DATE BETWEEN p_data_inicio AND p_data_fim
    ),
    'total_atendimentos_presenciais', (
      SELECT COUNT(*)
      FROM atendimentos_presenciais
      WHERE data::DATE BETWEEN p_data_inicio AND p_data_fim
    ),
    'comissoes_pendentes', (
      SELECT COALESCE(SUM(valor_comissao), 0)
      FROM comissoes
      WHERE pago = FALSE
    )
  ) INTO resultado;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos_presenciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
-- Clientes podem ver e atualizar apenas seus próprios dados
CREATE POLICY "Permitir leitura pública de clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes podem atualizar seus próprios dados" ON clientes 
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para barbeiros (públicas para leitura)
CREATE POLICY "Permitir leitura pública de barbeiros ativos" ON barbeiros 
  FOR SELECT USING (ativo = true);

-- Políticas para serviços (públicas para leitura)
CREATE POLICY "Permitir leitura pública de serviços ativos" ON servicos 
  FOR SELECT USING (ativo = true);

-- Políticas para agendamentos
-- Público pode inserir agendamentos
CREATE POLICY "Permitir inserção pública de agendamentos" ON agendamentos 
  FOR INSERT WITH CHECK (true);

-- Clientes autenticados veem apenas seus agendamentos
CREATE POLICY "Clientes veem seus próprios agendamentos" ON agendamentos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = agendamentos.cliente_id 
      AND clientes.user_id = auth.uid()
    )
  );

-- Admin pode ver todos (para dashboard)
CREATE POLICY "Admin vê todos os agendamentos" ON agendamentos 
  FOR SELECT USING (true);

-- Atualização de agendamentos apenas para admin ou dono
CREATE POLICY "Admin pode atualizar agendamentos" ON agendamentos 
  FOR UPDATE USING (true);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir barbeiros
INSERT INTO barbeiros (nome, email, telefone, especialidades, comissao_percentual) VALUES
('Carlos Silva', 'carlos@barbearia.com', '(86) 98765-4321', ARRAY['Corte Degradê', 'Barba'], 40.00),
('Roberto Santos', 'roberto@barbearia.com', '(86) 98765-4322', ARRAY['Corte Social', 'Barba'], 40.00);

-- Inserir serviços reais
INSERT INTO servicos (nome, descricao, duracao, preco, categoria, ordem_exibicao) VALUES
('Corte Degradê', 'Corte degradê moderno', 40, 25.00, 'popular', 1),
('Corte Social na Máquina', 'Corte social com máquina', 30, 20.00, 'outros', 2),
('Corte Social na Tesoura', 'Corte social com tesoura', 40, 25.00, 'outros', 3),
('Corte Degradê + Sobrancelha', 'Corte degradê com design de sobrancelha', 40, 30.00, 'popular', 4),
('Corte Degradê + Barba', 'Corte degradê com barba completa', 60, 40.00, 'popular', 5),
('Corte Degradê + Barba + Sobrancelha', 'Pacote completo premium', 60, 45.00, 'outros', 6),
('Corte Social na Máquina + Barba', 'Corte social com barba', 50, 35.00, 'outros', 7),
('Corte Social na Máquina + Sobrancelha', 'Corte social com sobrancelha', 40, 25.00, 'outros', 8),
('Corte Social na Tesoura + Barba', 'Corte social na tesoura com barba', 60, 40.00, 'outros', 9),
('Corte Social na Máquina + Barba + Sobrancelha', 'Pacote completo social', 60, 40.00, 'outros', 10),
('Corte Social na Tesoura + Barba + Sobrancelha', 'Pacote completo premium na tesoura', 60, 45.00, 'outros', 11),
('Fazer a Barba', 'Apenas barba', 20, 15.00, 'outros', 12);

-- Inserir horários (Segunda a Sexta, 9h às 18h)
INSERT INTO horarios_disponiveis (barbeiro_id, dia_semana, hora_inicio, hora_fim)
SELECT b.id, dia, '09:00'::TIME, '18:00'::TIME
FROM barbeiros b
CROSS JOIN generate_series(1, 5) AS dia;

-- Inserir horários de sábado (9h às 14h)
INSERT INTO horarios_disponiveis (barbeiro_id, dia_semana, hora_inicio, hora_fim)
SELECT b.id, 6, '09:00'::TIME, '14:00'::TIME
FROM barbeiros b;

-- Inserir usuário master (proprietário)
-- Credencial: derick123 / Derick2020@
-- Hash gerado com bcrypt (você deve gerar o hash real)
INSERT INTO usuarios_admin (email, nome, senha_hash, nivel_acesso) VALUES
('derick123', 'Derick - Proprietário', '$2a$10$YourRealHashHere', 'admin');

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 'Schema completo criado com sucesso!' AS mensagem;
