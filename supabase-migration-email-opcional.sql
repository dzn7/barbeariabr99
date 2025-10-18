-- ============================================
-- MIGRAÇÃO: Tornar email opcional na tabela clientes
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Data: 2025-10-13

-- 1. Remover a constraint NOT NULL do email
ALTER TABLE clientes 
ALTER COLUMN email DROP NOT NULL;

-- 2. Remover a constraint UNIQUE do email (para permitir múltiplos NULL)
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS clientes_email_key;

-- 3. Criar um índice parcial para garantir unicidade apenas para emails não-nulos
CREATE UNIQUE INDEX clientes_email_unique_idx 
ON clientes(email) 
WHERE email IS NOT NULL;

-- 4. Atualizar clientes existentes com emails temporários para NULL (opcional)
-- Descomente a linha abaixo se quiser limpar emails temporários existentes
-- UPDATE clientes SET email = NULL WHERE email LIKE '%@barbeariabr99.temp';

-- Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name = 'email';

SELECT 'Migração concluída com sucesso! Email agora é opcional.' AS mensagem;
