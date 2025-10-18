-- ============================================
-- MIGRAÇÃO: Remover verificação de telefone único
-- ============================================
-- Permite múltiplos clientes com mesmo telefone/nome
-- Execute este script no SQL Editor do Supabase
-- Data: 2025-10-17

-- 1. Remover qualquer constraint UNIQUE no telefone (se existir)
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS clientes_telefone_key;

-- 2. Remover índice único no telefone (se existir)
DROP INDEX IF EXISTS clientes_telefone_unique_idx;

-- 3. Manter apenas índice regular para performance (não único)
-- O índice idx_clientes_telefone já existe, então não precisa recriar

-- 4. Garantir que email é opcional e não único para múltiplos NULL
ALTER TABLE clientes 
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS clientes_email_key;

-- Criar índice parcial para emails (apenas não-nulos são únicos)
DROP INDEX IF EXISTS clientes_email_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_email_unique_idx 
ON clientes(email) 
WHERE email IS NOT NULL;

-- 5. Verificar estrutura final
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name IN ('nome', 'telefone', 'email')
ORDER BY ordinal_position;

-- 6. Verificar constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'clientes'::regclass;

SELECT '✅ Migração concluída! Múltiplos clientes podem ter o mesmo telefone/nome.' AS mensagem;
