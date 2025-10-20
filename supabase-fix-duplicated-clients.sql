-- Corrigir Clientes Duplicados
-- Remove clientes duplicados mantendo apenas o mais antigo

-- 1. Identificar clientes duplicados
SELECT user_id, COUNT(*) as total
FROM clientes
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 2. Criar tabela temporária com IDs para manter (os mais antigos)
CREATE TEMP TABLE clientes_para_manter AS
SELECT DISTINCT ON (user_id) id
FROM clientes
WHERE user_id IS NOT NULL
ORDER BY user_id, data_cadastro ASC;

-- 3. Deletar clientes duplicados (mantém apenas o mais antigo)
DELETE FROM clientes
WHERE user_id IS NOT NULL
  AND id NOT IN (SELECT id FROM clientes_para_manter);

-- 4. Adicionar constraint única para prevenir duplicatas futuras
ALTER TABLE clientes
ADD CONSTRAINT clientes_user_id_unique UNIQUE (user_id);

-- 5. Verificar resultado
SELECT user_id, COUNT(*) as total
FROM clientes
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Deve retornar 0 linhas se tudo estiver correto
