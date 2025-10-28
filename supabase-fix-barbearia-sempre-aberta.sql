-- ============================================
-- FIX: Barbearia Sempre Aberta
-- ============================================
-- Este script garante que a barbearia fique sempre aberta
-- exceto quando fechada MANUALMENTE pelo dashboard
-- ============================================

-- 1. Atualizar configuração para manter barbearia aberta
UPDATE configuracoes_barbearia
SET aberta = true
WHERE aberta = false OR aberta IS NULL;

-- 2. Adicionar constraint para garantir valor padrão
ALTER TABLE configuracoes_barbearia
ALTER COLUMN aberta SET DEFAULT true;

-- 3. Garantir que NOT NULL
ALTER TABLE configuracoes_barbearia
ALTER COLUMN aberta SET NOT NULL;

-- 4. Verificar resultado
SELECT 
  id,
  aberta,
  mensagem_fechamento,
  horario_abertura,
  horario_fechamento,
  atualizado_em
FROM configuracoes_barbearia;

-- ============================================
-- RESULTADO ESPERADO:
-- - aberta = true
-- - Barbearia funcionando normalmente
-- - Só fecha se admin desativar manualmente
-- ============================================
