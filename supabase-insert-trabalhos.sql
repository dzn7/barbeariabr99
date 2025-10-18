-- ============================================
-- INSERIR TRABALHOS NA TABELA
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- Limpar trabalhos existentes (se houver)
DELETE FROM trabalhos;

-- Inserir os 3 trabalhos com IDs específicos
INSERT INTO trabalhos (id, titulo, categoria, imagem_url, descricao, curtidas, ativo) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Degradê Moderno',
    'Corte Clássico',
    '/assets/img1.jpeg',
    'Corte degradê com acabamento profissional. Técnica moderna que valoriza o formato do rosto.',
    0,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Combo Completo',
    'Barba & Cabelo',
    '/assets/img2.jpeg',
    'Transformação completa com corte de cabelo e barba. Resultado impecável e profissional.',
    0,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Corte Degradê',
    'Estilo Premium',
    '/assets/img3.jpeg',
    'Corte social elegante e sofisticado. Perfeito para o dia a dia profissional.',
    0,
    true
  );

-- Verificar se foram inseridos
SELECT * FROM trabalhos;

SELECT 'Trabalhos inseridos com sucesso!' AS mensagem;
