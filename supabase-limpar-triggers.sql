-- ============================================
-- LIMPEZA DE TRIGGERS E FUNÇÕES
-- ============================================
-- Execute primeiro para remover qualquer trigger problemático

-- 1. Remover TODOS os triggers relacionados a clientes e auth
DROP TRIGGER IF EXISTS trigger_criar_cliente_apos_cadastro ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 2. Remover TODAS as funções relacionadas
DROP FUNCTION IF EXISTS criar_cliente_apos_cadastro() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Verificar se há outros triggers
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT tgname, tgrelid::regclass 
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname NOT LIKE 'pg_%'
      AND tgname NOT LIKE 'RI_%'
  LOOP
    RAISE NOTICE 'Trigger encontrado: % na tabela %', trigger_rec.tgname, trigger_rec.tgrelid;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_rec.tgname, trigger_rec.tgrelid);
  END LOOP;
END $$;

-- 4. Verificar constraints na tabela clientes
DO $$
BEGIN
  RAISE NOTICE '✅ Limpeza concluída!';
  RAISE NOTICE 'Agora execute o script: supabase-autenticacao-usuarios-simples.sql';
END $$;
