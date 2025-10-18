-- ============================================
-- CRIAR TABELA DE AVALIAÇÕES
-- ============================================

-- 1. Criar tabela avaliacoes
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome VARCHAR(255) NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT NOT NULL,
  servico VARCHAR(255),
  data TIMESTAMPTZ DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  verificado BOOLEAN DEFAULT FALSE,
  aprovado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aprovado ON avaliacoes(aprovado);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_nota ON avaliacoes(nota);

-- 3. Políticas RLS (Row Level Security)
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Política para visualizar avaliações aprovadas (público)
DROP POLICY IF EXISTS "Permitir visualização pública de avaliações aprovadas" ON avaliacoes;
CREATE POLICY "Permitir visualização pública de avaliações aprovadas" ON avaliacoes
  FOR SELECT USING (aprovado = true);

-- Política para inserir novas avaliações (público)
DROP POLICY IF EXISTS "Permitir inserção pública de avaliações" ON avaliacoes;
CREATE POLICY "Permitir inserção pública de avaliações" ON avaliacoes
  FOR INSERT WITH CHECK (true);

-- Política para atualizar likes (público)
DROP POLICY IF EXISTS "Permitir atualização de likes" ON avaliacoes;
CREATE POLICY "Permitir atualização de likes" ON avaliacoes
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Verificar
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela avaliacoes criada com sucesso!';
  RAISE NOTICE '✅ Políticas RLS configuradas!';
  RAISE NOTICE '✅ Sistema pronto para receber avaliações reais!';
END $$;
