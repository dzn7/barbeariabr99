-- ============================================
-- HABILITAR REALTIME PARA AGENDAMENTOS
-- ============================================
-- Execute este script para ativar o Realtime na tabela agendamentos

-- 1. Habilitar Realtime na tabela agendamentos
ALTER TABLE agendamentos REPLICA IDENTITY FULL;

-- 2. Verificar publicações existentes
DO $$
BEGIN
  -- Criar publicação se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 3. Adicionar tabela agendamentos à publicação
ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;

-- 4. Verificar se foi adicionado
DO $$
BEGIN
  RAISE NOTICE '✅ Realtime habilitado para tabela agendamentos!';
  RAISE NOTICE '✅ REPLICA IDENTITY configurado como FULL';
  RAISE NOTICE '';
  RAISE NOTICE '📡 Próximo passo:';
  RAISE NOTICE '   1. Vá em Database → Replication no Supabase Dashboard';
  RAISE NOTICE '   2. Ative a replicação para a tabela "agendamentos"';
  RAISE NOTICE '   3. Salve as alterações';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Depois, reinicie o bot: npm start';
END $$;
