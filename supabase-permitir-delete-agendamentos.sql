-- ============================================
-- PERMITIR EXCLUSÃO DE AGENDAMENTOS
-- ============================================
-- Execute este script para permitir que o admin delete agendamentos

-- 1. Remover política antiga de delete se existir
DROP POLICY IF EXISTS "Permitir exclusão de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin pode deletar agendamentos" ON agendamentos;

-- 2. Criar nova política para permitir DELETE
CREATE POLICY "Permitir exclusão de agendamentos" ON agendamentos 
  FOR DELETE USING (true);

-- 3. Verificar
DO $$
BEGIN
  RAISE NOTICE '✅ Política de DELETE criada com sucesso!';
  RAISE NOTICE 'Agora agendamentos podem ser excluídos permanentemente.';
END $$;
