-- Migração: Tornar campo descricao opcional na tabela servicos
-- Execute este script no SQL Editor do Supabase

ALTER TABLE servicos 
ALTER COLUMN descricao DROP NOT NULL;

-- Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'servicos' 
AND column_name = 'descricao';

SELECT 'Migração concluída. Campo descricao agora é opcional.' AS mensagem;
