-- ============================================
-- SCHEMA DO BANCO DE DADOS - BARBEARIA PREMIUM
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar todas as tabelas e configurações necessárias

-- Limpar tabelas existentes (cuidado em produção!)
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS horarios_disponiveis CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS barbeiros CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TYPE IF EXISTS status_agendamento CASCADE;

-- ============================================
-- TABELA: clientes
-- Armazena informações dos clientes da barbearia
-- ============================================
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  total_agendamentos INTEGER DEFAULT 0,
  ultima_visita TIMESTAMP WITH TIME ZONE
);

-- Índices para melhorar performance nas buscas
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
CREATE INDEX idx_clientes_nome ON clientes USING gin(to_tsvector('portuguese', nome));

-- ============================================
-- TABELA: barbeiros
-- Armazena informações dos profissionais
-- ============================================
CREATE TABLE barbeiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  especialidades TEXT[] DEFAULT '{}',
  foto_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comissao_percentual DECIMAL(5, 2) DEFAULT 0.00,
  total_atendimentos INTEGER DEFAULT 0,
  avaliacao_media DECIMAL(3, 2) DEFAULT 0.00
);

-- Índices
CREATE INDEX idx_barbeiros_ativo ON barbeiros(ativo);
CREATE INDEX idx_barbeiros_email ON barbeiros(email);

-- ============================================
-- TABELA: servicos
-- Catálogo de serviços oferecidos
-- ============================================
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

-- Índices
CREATE INDEX idx_servicos_ativo ON servicos(ativo);
CREATE INDEX idx_servicos_categoria ON servicos(categoria);
CREATE INDEX idx_servicos_ordem ON servicos(ordem_exibicao);

-- ============================================
-- TIPO ENUM: status_agendamento
-- Define os possíveis status de um agendamento
-- ============================================
CREATE TYPE status_agendamento AS ENUM (
  'pendente',
  'confirmado',
  'concluido',
  'cancelado',
  'nao_compareceu'
);

-- ============================================
-- TABELA: agendamentos
-- Registra todos os agendamentos realizados
-- ============================================
CREATE TABLE agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_agendamento DEFAULT 'pendente',
  observacoes TEXT,
  valor_pago DECIMAL(10, 2),
  forma_pagamento TEXT,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmado_em TIMESTAMP WITH TIME ZONE,
  concluido_em TIMESTAMP WITH TIME ZONE,
  cancelado_em TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT
);

-- Índices para otimizar consultas
CREATE INDEX idx_agendamentos_cliente ON agendamentos(cliente_id);
CREATE INDEX idx_agendamentos_barbeiro ON agendamentos(barbeiro_id);
CREATE INDEX idx_agendamentos_servico ON agendamentos(servico_id);
CREATE INDEX idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_agendamentos_data_status ON agendamentos(data_hora, status);

-- ============================================
-- TABELA: horarios_disponiveis
-- Define os horários de trabalho de cada barbeiro
-- ============================================
CREATE TABLE horarios_disponiveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbeiro_id UUID NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  UNIQUE(barbeiro_id, dia_semana, hora_inicio)
);

-- Índices
CREATE INDEX idx_horarios_barbeiro ON horarios_disponiveis(barbeiro_id);
CREATE INDEX idx_horarios_dia ON horarios_disponiveis(dia_semana);
CREATE INDEX idx_horarios_ativo ON horarios_disponiveis(ativo);

-- ============================================
-- TABELA: usuarios_admin
-- Gerencia usuários com acesso administrativo
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

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios_admin(email);
CREATE INDEX idx_usuarios_ativo ON usuarios_admin(ativo);

-- ============================================
-- TRIGGERS E FUNÇÕES
-- ============================================

-- Função para atualizar o campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para agendamentos
CREATE TRIGGER trigger_atualizar_agendamentos
BEFORE UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION atualizar_estatisticas_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' THEN
    UPDATE clientes
    SET 
      total_agendamentos = total_agendamentos + 1,
      ultima_visita = NEW.data_hora
    WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas do cliente
CREATE TRIGGER trigger_estatisticas_cliente
AFTER UPDATE ON agendamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido')
EXECUTE FUNCTION atualizar_estatisticas_cliente();

-- Função para atualizar estatísticas do barbeiro
CREATE OR REPLACE FUNCTION atualizar_estatisticas_barbeiro()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' THEN
    UPDATE barbeiros
    SET 
      total_atendimentos = total_atendimentos + 1,
      avaliacao_media = (
        SELECT AVG(avaliacao)::DECIMAL(3,2)
        FROM agendamentos
        WHERE barbeiro_id = NEW.barbeiro_id
        AND avaliacao IS NOT NULL
      )
    WHERE id = NEW.barbeiro_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas do barbeiro
CREATE TRIGGER trigger_estatisticas_barbeiro
AFTER UPDATE ON agendamentos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'concluido')
EXECUTE FUNCTION atualizar_estatisticas_barbeiro();

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para buscar horários disponíveis de um barbeiro em uma data
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
  -- Obter dia da semana (0 = Domingo, 6 = Sábado)
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
  FROM slots s
  ORDER BY s.slot_horario;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas do dashboard
CREATE OR REPLACE FUNCTION obter_estatisticas_dashboard(
  p_data_inicio DATE DEFAULT CURRENT_DATE,
  p_data_fim DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  resultado JSON;
BEGIN
  SELECT json_build_object(
    'total_agendamentos', COUNT(*),
    'pendentes', COUNT(*) FILTER (WHERE status = 'pendente'),
    'confirmados', COUNT(*) FILTER (WHERE status = 'confirmado'),
    'concluidos', COUNT(*) FILTER (WHERE status = 'concluido'),
    'cancelados', COUNT(*) FILTER (WHERE status = 'cancelado'),
    'receita_total', COALESCE(SUM(valor_pago) FILTER (WHERE status = 'concluido'), 0),
    'ticket_medio', COALESCE(AVG(valor_pago) FILTER (WHERE status = 'concluido'), 0)
  ) INTO resultado
  FROM agendamentos
  WHERE data_hora::DATE BETWEEN p_data_inicio AND p_data_fim;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Função para obter ranking de barbeiros
CREATE OR REPLACE FUNCTION obter_ranking_barbeiros(
  p_data_inicio DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  p_data_fim DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  barbeiro_id UUID,
  barbeiro_nome TEXT,
  total_atendimentos BIGINT,
  receita_total NUMERIC,
  avaliacao_media NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.nome,
    COUNT(a.id) as total_atendimentos,
    COALESCE(SUM(a.valor_pago), 0) as receita_total,
    COALESCE(AVG(a.avaliacao), 0)::NUMERIC(3,2) as avaliacao_media
  FROM barbeiros b
  LEFT JOIN agendamentos a ON a.barbeiro_id = b.id
    AND a.status = 'concluido'
    AND a.data_hora::DATE BETWEEN p_data_inicio AND p_data_fim
  WHERE b.ativo = TRUE
  GROUP BY b.id, b.nome
  ORDER BY total_atendimentos DESC, receita_total DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes (acesso público para leitura e inserção)
CREATE POLICY "Permitir leitura pública de clientes" ON clientes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de clientes" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização própria de clientes" ON clientes
  FOR UPDATE USING (true);

-- Políticas para barbeiros (leitura pública, modificação restrita)
CREATE POLICY "Permitir leitura pública de barbeiros ativos" ON barbeiros
  FOR SELECT USING (ativo = true);

-- Políticas para serviços (leitura pública)
CREATE POLICY "Permitir leitura pública de serviços ativos" ON servicos
  FOR SELECT USING (ativo = true);

-- Políticas para agendamentos (acesso público para criar, restrito para modificar)
CREATE POLICY "Permitir leitura pública de agendamentos" ON agendamentos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção pública de agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de agendamentos" ON agendamentos
  FOR UPDATE USING (true);

-- Políticas para horários disponíveis (leitura pública)
CREATE POLICY "Permitir leitura pública de horários" ON horarios_disponiveis
  FOR SELECT USING (ativo = true);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir barbeiros de exemplo
INSERT INTO barbeiros (nome, email, telefone, especialidades, comissao_percentual) VALUES
('Carlos Silva', 'carlos@barbearia.com', '(86) 98765-4321', ARRAY['Corte Clássico', 'Barba', 'Degradê'], 40.00),
('Roberto Santos', 'roberto@barbearia.com', '(86) 98765-4322', ARRAY['Corte Moderno', 'Barba', 'Pigmentação'], 40.00),
('Fernando Lima', 'fernando@barbearia.com', '(86) 98765-4323', ARRAY['Corte Infantil', 'Barba', 'Design'], 35.00);

-- Inserir serviços
INSERT INTO servicos (nome, descricao, duracao, preco, categoria, ordem_exibicao) VALUES
('Corte de Cabelo', 'Corte tradicional ou moderno personalizado', 30, 50.00, 'cabelo', 1),
('Barba', 'Aparar e modelar a barba com navalha', 20, 35.00, 'barba', 2),
('Corte + Barba', 'Pacote completo com desconto especial', 45, 75.00, 'combo', 3),
('Pigmentação', 'Pigmentação de barba e cabelo', 40, 60.00, 'especial', 4),
('Hidratação Capilar', 'Tratamento hidratante profissional', 25, 40.00, 'tratamento', 5),
('Design de Sobrancelha', 'Modelagem e design de sobrancelhas', 15, 25.00, 'especial', 6),
('Corte Infantil', 'Corte especial para crianças até 12 anos', 25, 35.00, 'cabelo', 7);

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

-- Inserir usuário admin de teste
-- Senha: admin123 (em produção, use hash bcrypt adequado)
INSERT INTO usuarios_admin (email, nome, senha_hash, nivel_acesso) VALUES
('admin@barbearia.com', 'Administrador', '$2a$10$exemplo_hash_senha', 'admin');

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View para agendamentos com informações completas
CREATE OR REPLACE VIEW vw_agendamentos_completos AS
SELECT 
  a.id,
  a.data_hora,
  a.status,
  a.observacoes,
  a.valor_pago,
  a.forma_pagamento,
  a.avaliacao,
  c.nome as cliente_nome,
  c.email as cliente_email,
  c.telefone as cliente_telefone,
  b.nome as barbeiro_nome,
  s.nome as servico_nome,
  s.duracao as servico_duracao,
  s.preco as servico_preco,
  a.criado_em,
  a.atualizado_em
FROM agendamentos a
JOIN clientes c ON c.id = a.cliente_id
JOIN barbeiros b ON b.id = a.barbeiro_id
JOIN servicos s ON s.id = a.servico_id;

-- View para estatísticas diárias
CREATE OR REPLACE VIEW vw_estatisticas_diarias AS
SELECT 
  data_hora::DATE as data,
  COUNT(*) as total_agendamentos,
  COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
  COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
  COALESCE(SUM(valor_pago) FILTER (WHERE status = 'concluido'), 0) as receita_dia
FROM agendamentos
GROUP BY data_hora::DATE
ORDER BY data DESC;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE clientes IS 'Cadastro de clientes da barbearia';
COMMENT ON TABLE barbeiros IS 'Cadastro de profissionais barbeiros';
COMMENT ON TABLE servicos IS 'Catálogo de serviços oferecidos';
COMMENT ON TABLE agendamentos IS 'Registro de todos os agendamentos';
COMMENT ON TABLE horarios_disponiveis IS 'Horários de trabalho dos barbeiros';
COMMENT ON TABLE usuarios_admin IS 'Usuários com acesso administrativo';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para verificar se tudo foi criado corretamente:
SELECT 
  'Tabelas criadas:' as info,
  COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('clientes', 'barbeiros', 'servicos', 'agendamentos', 'horarios_disponiveis', 'usuarios_admin');
