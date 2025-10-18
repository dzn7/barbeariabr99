-- ============================================
-- MIGRAÇÃO: Criar tabela de configurações
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão de horário
INSERT INTO configuracoes (chave, valor, descricao) 
VALUES (
  'horario_funcionamento',
  '{
    "segunda": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "terca": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "quarta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "quinta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "sexta": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "sabado": {"aberto": true, "inicio": "09:00", "fim": "18:00"},
    "domingo": {"aberto": false, "inicio": "09:00", "fim": "18:00"}
  }'::jsonb,
  'Horário de funcionamento da barbearia'
)
ON CONFLICT (chave) DO NOTHING;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- Habilitar RLS
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler
CREATE POLICY "Permitir leitura pública de configurações"
  ON configuracoes FOR SELECT
  USING (true);

-- Política: Apenas autenticados podem atualizar
CREATE POLICY "Permitir atualização para usuários autenticados"
  ON configuracoes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Verificar resultado
SELECT * FROM configuracoes WHERE chave = 'horario_funcionamento';

SELECT 'Migração concluída! Tabela de configurações criada.' AS mensagem;
