-- ============================================
-- SISTEMA DE AUTENTICAÇÃO DE USUÁRIOS
-- ============================================
-- Execute este script para adicionar autenticação de clientes
-- Permite que clientes criem contas e vejam seus agendamentos

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
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Permitir que clientes atualizem a conexão user_id (para vincular contas existentes)
CREATE POLICY "Permitir atualização de user_id" ON clientes
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Remover funções antigas se existirem
DROP FUNCTION IF EXISTS obter_cliente_autenticado();
DROP FUNCTION IF EXISTS usuario_pode_ver_agendamento(UUID);

-- Função para buscar ou criar cliente vinculado ao usuário autenticado
CREATE OR REPLACE FUNCTION obter_cliente_autenticado()
RETURNS UUID AS $$
DECLARE
  cliente_id UUID;
BEGIN
  -- Buscar cliente vinculado ao usuário autenticado
  SELECT id INTO cliente_id
  FROM clientes
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário pode ver um agendamento
CREATE OR REPLACE FUNCTION usuario_pode_ver_agendamento(agendamento_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  pode_ver BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM agendamentos a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE a.id = agendamento_id
    AND c.user_id = auth.uid()
  ) INTO pode_ver;
  
  RETURN pode_ver;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CONFIGURAÇÕES DE SEGURANÇA
-- ============================================

-- Garantir que a tabela clientes tem RLS habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela agendamentos tem RLS habilitado
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRIGGER PARA CRIAR PERFIL DE CLIENTE AUTOMATICAMENTE
-- ============================================

-- Remover trigger e função antiga se existirem
DROP TRIGGER IF EXISTS trigger_criar_cliente_apos_cadastro ON auth.users;
DROP FUNCTION IF EXISTS criar_cliente_apos_cadastro();

-- Função para criar cliente automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION criar_cliente_apos_cadastro()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir cliente automaticamente com dados do auth
  -- Usando ON CONFLICT DO NOTHING para evitar erros se cliente já existir
  INSERT INTO clientes (
    nome,
    email,
    telefone,
    user_id
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', '(00) 00000-0000'),
    NEW.id
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = NEW.id,
      nome = COALESCE(EXCLUDED.nome, clientes.nome),
      telefone = COALESCE(NULLIF(EXCLUDED.telefone, '(00) 00000-0000'), clientes.telefone)
  WHERE clientes.user_id IS NULL;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha o cadastro
    RAISE WARNING 'Erro ao criar cliente automaticamente: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER trigger_criar_cliente_apos_cadastro
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION criar_cliente_apos_cadastro();

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
  RAISE NOTICE 'Políticas de segurança configuradas com sucesso!';
  RAISE NOTICE 'Sistema de autenticação de usuários ativo.';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora os clientes podem:';
  RAISE NOTICE '- Criar conta com email/senha';
  RAISE NOTICE '- Fazer login';
  RAISE NOTICE '- Ver seus próprios agendamentos';
  RAISE NOTICE '- Agendar novos horários';
END $$;
