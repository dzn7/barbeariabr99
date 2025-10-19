-- ============================================
-- CORRIGIR POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Este script corrige os erros de CORS e permissões do Supabase
-- Execute no Supabase SQL Editor para permitir acesso às tabelas

-- ============================================
-- 1. AGENDAMENTOS - Permitir leitura pública
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir leitura pública de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Clientes veem seus próprios agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin vê todos os agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Permitir atualização de agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Admin pode atualizar agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Permitir exclusão de agendamentos" ON agendamentos;

-- Criar políticas novas (mais permissivas)
-- SELECT: Permitir leitura para todos
CREATE POLICY "Permitir leitura de agendamentos" ON agendamentos
  FOR SELECT USING (true);

-- INSERT: Permitir inserção para todos
CREATE POLICY "Permitir inserção de agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (true);

-- UPDATE: Permitir atualização para todos
CREATE POLICY "Permitir atualização de agendamentos" ON agendamentos
  FOR UPDATE USING (true);

-- DELETE: Permitir exclusão para todos
CREATE POLICY "Permitir exclusão de agendamentos" ON agendamentos
  FOR DELETE USING (true);

-- ============================================
-- 2. ATENDIMENTOS PRESENCIAIS
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de atendimentos" ON atendimentos_presenciais;
DROP POLICY IF EXISTS "Permitir inserção de atendimentos" ON atendimentos_presenciais;
DROP POLICY IF EXISTS "Permitir atualização de atendimentos" ON atendimentos_presenciais;
DROP POLICY IF EXISTS "Permitir exclusão de atendimentos" ON atendimentos_presenciais;

-- Criar políticas
CREATE POLICY "Permitir leitura de atendimentos" ON atendimentos_presenciais
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de atendimentos" ON atendimentos_presenciais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de atendimentos" ON atendimentos_presenciais
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de atendimentos" ON atendimentos_presenciais
  FOR DELETE USING (true);

-- ============================================
-- 3. TRANSAÇÕES (DESPESAS)
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de transações" ON transacoes;
DROP POLICY IF EXISTS "Permitir inserção de transações" ON transacoes;
DROP POLICY IF EXISTS "Permitir atualização de transações" ON transacoes;
DROP POLICY IF EXISTS "Permitir exclusão de transações" ON transacoes;

-- Criar políticas
CREATE POLICY "Permitir leitura de transações" ON transacoes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de transações" ON transacoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de transações" ON transacoes
  FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão de transações" ON transacoes
  FOR DELETE USING (true);

-- ============================================
-- 4. OUTRAS TABELAS NECESSÁRIAS
-- ============================================

-- CLIENTES
DROP POLICY IF EXISTS "Permitir leitura de clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON clientes;
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON clientes;

CREATE POLICY "Permitir leitura de clientes" ON clientes
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de clientes" ON clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de clientes" ON clientes
  FOR UPDATE USING (true);

-- BARBEIROS
DROP POLICY IF EXISTS "Permitir leitura de barbeiros" ON barbeiros;
DROP POLICY IF EXISTS "Permitir inserção de barbeiros" ON barbeiros;
DROP POLICY IF EXISTS "Permitir atualização de barbeiros" ON barbeiros;

CREATE POLICY "Permitir leitura de barbeiros" ON barbeiros
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de barbeiros" ON barbeiros
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de barbeiros" ON barbeiros
  FOR UPDATE USING (true);

-- SERVIÇOS
DROP POLICY IF EXISTS "Permitir leitura de servicos" ON servicos;
DROP POLICY IF EXISTS "Permitir inserção de servicos" ON servicos;
DROP POLICY IF EXISTS "Permitir atualização de servicos" ON servicos;

CREATE POLICY "Permitir leitura de servicos" ON servicos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de servicos" ON servicos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de servicos" ON servicos
  FOR UPDATE USING (true);

-- ============================================
-- 5. VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS atualizadas com sucesso!';
  RAISE NOTICE '✅ Todas as tabelas agora permitem acesso completo';
  RAISE NOTICE '✅ Erros de CORS e permissões devem estar resolvidos';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Estas políticas são permissivas';
  RAISE NOTICE '⚠️  Para produção, considere restringir o acesso';
  RAISE NOTICE '⚠️  baseado em autenticação de usuários';
END $$;
