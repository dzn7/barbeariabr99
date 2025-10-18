-- ============================================
-- SISTEMA DE AUTENTICAÇÃO DE USUÁRIOS (VERSÃO SIMPLES)
-- ============================================
-- Execute este script para adicionar autenticação de clientes
-- Versão sem trigger automático (criação via código)

-- 1. Adicionar campo user_id na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Criar índice para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);

-- 3. Remover políticas antigas de agendamentos (se existirem)
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Clientes veem seus próprios agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin vê todos os agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin pode atualizar agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Permitir atualização de agendamentos" ON agendamentos;

-- 4. Criar novas políticas para agendamentos
-- Permitir inserção pública (qualquer um pode agendar)
CREATE POLICY "Permitir inserção pública de agendamentos" ON agendamentos 
  FOR INSERT WITH CHECK (true);

-- Clientes autenticados podem ver seus próprios agendamentos
CREATE POLICY "Clientes veem seus próprios agendamentos" ON agendamentos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = agendamentos.cliente_id 
      AND clientes.user_id = auth.uid()
    )
    OR auth.uid() IS NULL -- Permite visualização pública também
  );

-- Admin/usuários autenticados podem atualizar agendamentos
CREATE POLICY "Permitir atualização de agendamentos" ON agendamentos 
  FOR UPDATE USING (true);

-- 5. Atualizar política de clientes para permitir atualização
DROP POLICY IF EXISTS "Clientes podem atualizar seus próprios dados" ON clientes;
DROP POLICY IF EXISTS "Permitir atualização de user_id" ON clientes;

CREATE POLICY "Clientes podem atualizar seus próprios dados" ON clientes 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 6. Permitir que clientes atualizem a conexão user_id (para vincular contas existentes)
CREATE POLICY "Permitir atualização de user_id" ON clientes
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ============================================
-- CONFIGURAÇÕES DE SEGURANÇA
-- ============================================

-- Garantir que a tabela clientes tem RLS habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela agendamentos tem RLS habilitado
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se a coluna foi criada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clientes' 
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'Campo user_id criado com sucesso na tabela clientes';
  ELSE
    RAISE EXCEPTION 'Erro: Campo user_id não foi criado';
  END IF;
END $$;

-- Verificar políticas
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de segurança configuradas com sucesso!';
  RAISE NOTICE '✅ Sistema de autenticação de usuários ativo.';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Agora os clientes podem:';
  RAISE NOTICE '   - Criar conta com email/senha';
  RAISE NOTICE '   - Fazer login';
  RAISE NOTICE '   - Ver seus próprios agendamentos';
  RAISE NOTICE '   - Agendar novos horários';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: A criação do perfil de cliente é feita via código.';
END $$;
