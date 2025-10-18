-- ============================================
-- SQL para Funcionalidades do Dashboard
-- Edição de Preços e Remarcação de Horários
-- ============================================

-- 1. Adicionar campo de histórico de alterações nos serviços
ALTER TABLE servicos 
ADD COLUMN IF NOT EXISTS preco_anterior DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS data_alteracao_preco TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS alterado_por TEXT;

-- 2. Criar tabela de histórico de alterações de agendamentos
CREATE TABLE IF NOT EXISTS historico_agendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  data_hora_anterior TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hora_nova TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT,
  alterado_por TEXT NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cliente_notificado BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT fk_agendamento FOREIGN KEY (agendamento_id) 
    REFERENCES agendamentos(id) ON DELETE CASCADE
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_agendamentos_agendamento_id 
  ON historico_agendamentos(agendamento_id);
  
CREATE INDEX IF NOT EXISTS idx_historico_agendamentos_data_alteracao 
  ON historico_agendamentos(data_alteracao DESC);

-- 4. Criar função para registrar alteração de agendamento
CREATE OR REPLACE FUNCTION registrar_alteracao_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a data/hora foi alterada, registrar no histórico
  IF OLD.data_hora IS DISTINCT FROM NEW.data_hora THEN
    INSERT INTO historico_agendamentos (
      agendamento_id,
      data_hora_anterior,
      data_hora_nova,
      alterado_por
    ) VALUES (
      NEW.id,
      OLD.data_hora,
      NEW.data_hora,
      COALESCE(current_setting('app.user_email', true), 'sistema')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para alterações de agendamento
DROP TRIGGER IF EXISTS trigger_alteracao_agendamento ON agendamentos;
CREATE TRIGGER trigger_alteracao_agendamento
  AFTER UPDATE ON agendamentos
  FOR EACH ROW
  WHEN (OLD.data_hora IS DISTINCT FROM NEW.data_hora)
  EXECUTE FUNCTION registrar_alteracao_agendamento();

-- 6. Adicionar RLS (Row Level Security) para histórico
ALTER TABLE historico_agendamentos ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para todos autenticados
CREATE POLICY "Permitir leitura histórico" ON historico_agendamentos
  FOR SELECT
  USING (true);

-- Política: Permitir inserção para todos autenticados
CREATE POLICY "Permitir inserção histórico" ON historico_agendamentos
  FOR INSERT
  WITH CHECK (true);

-- 7. Criar view para facilitar consultas
CREATE OR REPLACE VIEW vw_agendamentos_com_historico AS
SELECT 
  a.id,
  a.data_hora,
  a.status,
  c.nome AS cliente_nome,
  c.telefone AS cliente_telefone,
  b.nome AS barbeiro_nome,
  s.nome AS servico_nome,
  s.preco AS servico_preco,
  s.duracao AS servico_duracao,
  (
    SELECT COUNT(*) 
    FROM historico_agendamentos ha 
    WHERE ha.agendamento_id = a.id
  ) AS total_alteracoes,
  (
    SELECT MAX(ha.data_alteracao)
    FROM historico_agendamentos ha
    WHERE ha.agendamento_id = a.id
  ) AS ultima_alteracao
FROM agendamentos a
LEFT JOIN clientes c ON a.cliente_id = c.id
LEFT JOIN barbeiros b ON a.barbeiro_id = b.id
LEFT JOIN servicos s ON a.servico_id = s.id
ORDER BY a.data_hora DESC;

-- 8. Comentários para documentação
COMMENT ON TABLE historico_agendamentos IS 'Registra todas as alterações de data/hora dos agendamentos';
COMMENT ON COLUMN historico_agendamentos.cliente_notificado IS 'Indica se o cliente foi notificado via WhatsApp sobre a alteração';
COMMENT ON COLUMN servicos.preco_anterior IS 'Armazena o preço anterior quando há alteração';
COMMENT ON COLUMN servicos.data_alteracao_preco IS 'Data da última alteração de preço';

-- ============================================
-- Fim do Script
-- ============================================
