-- Adicionar coluna intervalo_horarios na tabela configuracoes_barbearia
-- Permite configurar o intervalo entre horários (15, 20, 30 minutos)

ALTER TABLE configuracoes_barbearia 
ADD COLUMN IF NOT EXISTS intervalo_horarios INTEGER DEFAULT 20 
CHECK (intervalo_horarios IN (15, 20, 30));

COMMENT ON COLUMN configuracoes_barbearia.intervalo_horarios IS 
'Intervalo em minutos entre horários disponíveis (15, 20 ou 30 minutos)';

-- Atualizar registros existentes para usar 20 minutos como padrão
UPDATE configuracoes_barbearia 
SET intervalo_horarios = 20 
WHERE intervalo_horarios IS NULL;
