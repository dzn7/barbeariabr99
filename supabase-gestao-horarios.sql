-- =====================================================
-- SISTEMA DE GESTÃO DE HORÁRIOS PROFISSIONAL
-- =====================================================

-- Tabela de configurações da barbearia
CREATE TABLE IF NOT EXISTS configuracoes_barbearia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aberta BOOLEAN DEFAULT true,
  mensagem_fechamento TEXT,
  horario_abertura TIME DEFAULT '09:00',
  horario_fechamento TIME DEFAULT '18:00',
  dias_funcionamento JSONB DEFAULT '["seg", "ter", "qua", "qui", "sex", "sab"]'::jsonb,
  intervalo_almoco_inicio TIME,
  intervalo_almoco_fim TIME,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tabela de horários bloqueados
CREATE TABLE IF NOT EXISTS horarios_bloqueados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID REFERENCES barbeiros(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  motivo TEXT,
  tipo VARCHAR(50) DEFAULT 'bloqueio_manual', -- bloqueio_manual, folga, feriado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint para evitar bloqueios duplicados
  CONSTRAINT unique_bloqueio UNIQUE (barbeiro_id, data, horario_inicio)
);

-- Tabela de histórico de mudanças
CREATE TABLE IF NOT EXISTS historico_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- abertura, fechamento, horario_alterado, bloqueio_criado
  descricao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão se não existir
INSERT INTO configuracoes_barbearia (id, aberta, horario_abertura, horario_fechamento)
SELECT gen_random_uuid(), true, '09:00', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM configuracoes_barbearia);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_data ON horarios_bloqueados(data);
CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_barbeiro ON horarios_bloqueados(barbeiro_id);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON historico_configuracoes(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE configuracoes_barbearia ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_bloqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso

-- Configurações: todos podem ler, apenas autenticados podem editar
CREATE POLICY "Todos podem ler configurações"
  ON configuracoes_barbearia FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Apenas autenticados podem editar configurações"
  ON configuracoes_barbearia FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Horários bloqueados: todos podem ler, apenas autenticados podem gerenciar
CREATE POLICY "Todos podem ler horários bloqueados"
  ON horarios_bloqueados FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Apenas autenticados podem gerenciar bloqueios"
  ON horarios_bloqueados FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Histórico: apenas autenticados podem ler
CREATE POLICY "Apenas autenticados podem ler histórico"
  ON historico_configuracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sistema pode inserir no histórico"
  ON historico_configuracoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para registrar mudanças automaticamente
CREATE OR REPLACE FUNCTION registrar_mudanca_configuracao()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO historico_configuracoes (tipo, descricao, dados_anteriores, dados_novos, usuario_id)
    VALUES (
      'configuracao_alterada',
      'Configurações da barbearia foram alteradas',
      row_to_json(OLD),
      row_to_json(NEW),
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar mudanças
DROP TRIGGER IF EXISTS trigger_registrar_mudanca_config ON configuracoes_barbearia;
CREATE TRIGGER trigger_registrar_mudanca_config
  AFTER UPDATE ON configuracoes_barbearia
  FOR EACH ROW
  EXECUTE FUNCTION registrar_mudanca_configuracao();

-- Função para verificar se barbearia está aberta
CREATE OR REPLACE FUNCTION barbearia_esta_aberta()
RETURNS BOOLEAN AS $$
DECLARE
  config RECORD;
  dia_semana TEXT;
  hora_atual TIME;
BEGIN
  SELECT * INTO config FROM configuracoes_barbearia LIMIT 1;
  
  IF NOT FOUND OR NOT config.aberta THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar dia da semana
  dia_semana := CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'dom'
    WHEN 1 THEN 'seg'
    WHEN 2 THEN 'ter'
    WHEN 3 THEN 'qua'
    WHEN 4 THEN 'qui'
    WHEN 5 THEN 'sex'
    WHEN 6 THEN 'sab'
  END;
  
  IF NOT (config.dias_funcionamento ? dia_semana) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar horário
  hora_atual := CURRENT_TIME;
  
  IF hora_atual < config.horario_abertura OR hora_atual > config.horario_fechamento THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar intervalo de almoço
  IF config.intervalo_almoco_inicio IS NOT NULL AND config.intervalo_almoco_fim IS NOT NULL THEN
    IF hora_atual >= config.intervalo_almoco_inicio AND hora_atual <= config.intervalo_almoco_fim THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE configuracoes_barbearia IS 'Configurações gerais de funcionamento da barbearia';
COMMENT ON TABLE horarios_bloqueados IS 'Horários bloqueados para agendamento (folgas, feriados, etc)';
COMMENT ON TABLE historico_configuracoes IS 'Histórico de todas as mudanças nas configurações';
