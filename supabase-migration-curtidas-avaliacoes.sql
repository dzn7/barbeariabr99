-- ============================================
-- MIGRAÇÃO: Sistema de Curtidas e Avaliações Públicas
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de trabalhos/fotos
CREATE TABLE IF NOT EXISTS trabalhos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  descricao TEXT,
  curtidas INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de curtidas (para rastrear quem curtiu)
CREATE TABLE IF NOT EXISTS curtidas_trabalhos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trabalho_id UUID REFERENCES trabalhos(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trabalho_id, ip_address)
);

-- 3. Criar tabela de avaliações públicas
CREATE TABLE IF NOT EXISTS avaliacoes_publicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  avaliacao INTEGER NOT NULL CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario TEXT NOT NULL,
  aprovado BOOLEAN DEFAULT TRUE, -- Aprovado por padrão
  ip_address TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir trabalhos de exemplo (baseado nas imagens existentes)
-- Usar IDs específicos para corresponder ao código frontend
INSERT INTO trabalhos (id, titulo, categoria, imagem_url, descricao, curtidas, ativo) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Degradê Moderno', 'Corte Clássico', '/assets/img1.jpeg', 'Corte degradê com acabamento profissional. Técnica moderna que valoriza o formato do rosto.', 0, true),
  ('00000000-0000-0000-0000-000000000002', 'Combo Completo', 'Barba & Cabelo', '/assets/img2.jpeg', 'Transformação completa com corte de cabelo e barba. Resultado impecável e profissional.', 0, true),
  ('00000000-0000-0000-0000-000000000003', 'Corte Degradê', 'Estilo Premium', '/assets/img3.jpeg', 'Corte social elegante e sofisticado. Perfeito para o dia a dia profissional.', 0, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_trabalhos_ativo ON trabalhos(ativo);
CREATE INDEX IF NOT EXISTS idx_curtidas_trabalho ON curtidas_trabalhos(trabalho_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aprovado ON avaliacoes_publicas(aprovado);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_criado ON avaliacoes_publicas(criado_em DESC);

-- 6. Habilitar RLS
ALTER TABLE trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE curtidas_trabalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_publicas ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de trabalhos
DROP POLICY IF EXISTS "Permitir leitura pública de trabalhos" ON trabalhos;
CREATE POLICY "Permitir leitura pública de trabalhos"
  ON trabalhos FOR SELECT
  USING (ativo = true);

DROP POLICY IF EXISTS "Permitir atualização pública de trabalhos" ON trabalhos;
CREATE POLICY "Permitir atualização pública de trabalhos"
  ON trabalhos FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de trabalhos para autenticados" ON trabalhos;
CREATE POLICY "Permitir inserção de trabalhos para autenticados"
  ON trabalhos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 8. Políticas de curtidas
DROP POLICY IF EXISTS "Permitir leitura pública de curtidas" ON curtidas_trabalhos;
CREATE POLICY "Permitir leitura pública de curtidas"
  ON curtidas_trabalhos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir inserção pública de curtidas" ON curtidas_trabalhos;
CREATE POLICY "Permitir inserção pública de curtidas"
  ON curtidas_trabalhos FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de próprias curtidas" ON curtidas_trabalhos;
CREATE POLICY "Permitir exclusão de próprias curtidas"
  ON curtidas_trabalhos FOR DELETE
  USING (true);

-- 9. Políticas de avaliações
DROP POLICY IF EXISTS "Permitir leitura de avaliações aprovadas" ON avaliacoes_publicas;
CREATE POLICY "Permitir leitura de avaliações aprovadas"
  ON avaliacoes_publicas FOR SELECT
  USING (aprovado = true);

DROP POLICY IF EXISTS "Permitir inserção pública de avaliações" ON avaliacoes_publicas;
CREATE POLICY "Permitir inserção pública de avaliações"
  ON avaliacoes_publicas FOR INSERT
  WITH CHECK (true);

-- 10. Função para incrementar curtidas
CREATE OR REPLACE FUNCTION incrementar_curtidas(trabalho_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE trabalhos 
  SET curtidas = curtidas + 1 
  WHERE id = trabalho_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Função para decrementar curtidas
CREATE OR REPLACE FUNCTION decrementar_curtidas(trabalho_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE trabalhos 
  SET curtidas = GREATEST(curtidas - 1, 0)
  WHERE id = trabalho_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar resultado
SELECT 'Migração concluída! Sistema de curtidas e avaliações criado.' AS mensagem;
SELECT * FROM trabalhos;
