# Sistema de Curtidas e Avaliações Públicas

## Visão Geral
Sistema completo que permite aos visitantes curtir fotos dos trabalhos e deixar avaliações sem necessidade de login ou aprovação prévia.

## Funcionalidades Implementadas

### 1. Sistema de Curtidas em Fotos

#### Características:
- ✅ Curtir/descurtir fotos sem login
- ✅ Contador de curtidas em tempo real
- ✅ Identificação por navegador (localStorage)
- ✅ Animações suaves ao curtir
- ✅ Prevenção de curtidas duplicadas
- ✅ Ícone de coração que muda de cor

#### Como Funciona:
1. Visitante clica no botão de coração na foto
2. Sistema gera ID único do cliente (armazenado no localStorage)
3. Curtida é registrada no banco de dados
4. Contador é incrementado
5. Botão muda para estado "curtido" (coração vermelho preenchido)

#### Tecnologias:
- **Identificação**: localStorage + timestamp + random
- **Banco de Dados**: Tabela `curtidas_trabalhos`
- **Funções RPC**: `incrementar_curtidas()`, `decrementar_curtidas()`

### 2. Avaliações Públicas (Sem Aprovação)

#### Características:
- ✅ Qualquer pessoa pode deixar avaliação
- ✅ Publicação instantânea (sem moderação)
- ✅ Sistema de estrelas (1-5)
- ✅ Campo de comentário obrigatório (mínimo 10 caracteres)
- ✅ Nome do avaliador obrigatório
- ✅ Exibição em tempo real
- ✅ **Sem alerts** - Usa modals responsivos
- ✅ Validação amigável com feedback visual
- ✅ Loading states durante envio

#### Mudanças:
**Antes:**
```tsx
aprovado: false // Precisava aprovação do admin
alert("Avaliação enviada!") // Alert nativo
```

**Depois:**
```tsx
aprovado: true // Aprovado automaticamente
mostrarFeedback('sucesso', 'Avaliação publicada!', 'Obrigado...') // Modal responsivo
```

#### Validações:
1. **Nome**: Obrigatório e não vazio
2. **Comentário**: Obrigatório e mínimo 10 caracteres
3. **Nota**: Sempre válida (1-5 estrelas)
4. **Feedback**: Modal responsivo com ícones e cores

## Estrutura do Banco de Dados

### Tabela: `trabalhos`
```sql
- id: UUID (PK)
- titulo: TEXT
- categoria: TEXT
- imagem_url: TEXT
- descricao: TEXT
- curtidas: INTEGER (contador)
- ativo: BOOLEAN
- criado_em: TIMESTAMP
```

### Tabela: `curtidas_trabalhos`
```sql
- id: UUID (PK)
- trabalho_id: UUID (FK)
- ip_address: TEXT (identificador único)
- user_agent: TEXT
- criado_em: TIMESTAMP
- UNIQUE(trabalho_id, ip_address) -- Previne duplicatas
```

### Tabela: `avaliacoes_publicas`
```sql
- id: UUID (PK)
- nome: TEXT
- avaliacao: INTEGER (1-5)
- comentario: TEXT
- aprovado: BOOLEAN (default TRUE)
- ip_address: TEXT
- criado_em: TIMESTAMP
```

## Componentes

### 1. CarrosselTrabalhosComCurtidas
**Arquivo:** `/components/CarrosselTrabalhosComCurtidas.tsx`

Carrossel de fotos com sistema de curtidas integrado.

**Funcionalidades:**
- Botão de curtir flutuante no canto superior direito
- Contador de curtidas visível
- Animação ao curtir (scale + cor)
- Estado persistente (curtido/não curtido)
- Feedback visual imediato

**Exemplo de uso:**
```tsx
import { Carousel, Card } from '@/components/CarrosselTrabalhosComCurtidas';

const trabalhos = [
  {
    id: "uuid-do-trabalho",
    title: "Degradê Moderno",
    category: "Corte Clássico",
    src: "/assets/img1.jpeg",
    curtidas: 15,
    content: <div>Descrição...</div>
  }
];

const cards = trabalhos.map((trabalho, index) => (
  <Card key={trabalho.id} card={trabalho} index={index} />
));

<Carousel items={cards} />
```

### 2. SecaoAvaliacoes (Atualizada)
**Arquivo:** `/components/SecaoAvaliacoes.tsx`

Seção de avaliações com publicação instantânea.

**Mudanças:**
- Usa tabela `avaliacoes_publicas` em vez de `avaliacoes`
- Campo `aprovado: true` por padrão
- Busca combinada (avaliações antigas + novas)
- Feedback imediato ao usuário

## Segurança

### RLS (Row Level Security)

#### Trabalhos:
- **SELECT**: Público (apenas ativos)
- **UPDATE**: Público (apenas contador de curtidas)

#### Curtidas:
- **SELECT**: Público
- **INSERT**: Público
- **DELETE**: Público (para descurtir)

#### Avaliações Públicas:
- **SELECT**: Público (apenas aprovadas)
- **INSERT**: Público

### Prevenção de Abuso:
1. **Curtidas duplicadas**: UNIQUE constraint no banco
2. **Identificação**: localStorage + user agent
3. **Validação**: Campos obrigatórios no frontend
4. **Limite**: Uma curtida por trabalho por cliente

## Como Usar

### 1. Executar Migração
```bash
# No SQL Editor do Supabase
supabase-migration-curtidas-avaliacoes.sql
```

### 2. Curtir Fotos
1. Acesse a página inicial
2. Role até "Conheça nosso trabalho"
3. Clique no coração em qualquer foto
4. Contador aumenta instantaneamente

### 3. Deixar Avaliação
1. Acesse a seção "Avaliações"
2. Clique em "Deixar Avaliação"
3. Preencha nome, nota e comentário
4. Clique em "Enviar"
5. Avaliação aparece imediatamente

## Benefícios

### Para Usuários:
- ✅ Sem necessidade de criar conta
- ✅ Feedback instantâneo
- ✅ Experiência fluida e rápida
- ✅ Interação social (curtidas)

### Para o Negócio:
- ✅ Mais engajamento
- ✅ Prova social (curtidas visíveis)
- ✅ Avaliações em tempo real
- ✅ Sem trabalho de moderação

### Técnicos:
- ✅ Escalável (RPC functions)
- ✅ Seguro (RLS policies)
- ✅ Performance (índices otimizados)
- ✅ Manutenível (código limpo)

## Métricas Disponíveis

### Dashboard pode mostrar:
- Total de curtidas por foto
- Fotos mais curtidas
- Total de avaliações
- Média de estrelas
- Avaliações por período
- Taxa de engajamento

## Próximas Melhorias

- [ ] Sistema de moderação opcional
- [ ] Relatório de abuso
- [ ] Compartilhamento social
- [ ] Galeria de fotos mais curtidas
- [ ] Notificações de novas avaliações
- [ ] Analytics de engajamento
- [ ] Filtro de avaliações por estrelas
- [ ] Resposta do proprietário às avaliações

## Exemplo de Fluxo

### Curtir uma Foto:
```
1. Usuário clica no coração
2. Sistema verifica se já curtiu (localStorage)
3. Se não curtiu:
   - Insere em curtidas_trabalhos
   - Incrementa contador em trabalhos
   - Atualiza UI (coração vermelho)
4. Se já curtiu:
   - Remove de curtidas_trabalhos
   - Decrementa contador
   - Atualiza UI (coração vazio)
```

### Deixar Avaliação:
```
1. Usuário preenche formulário
2. Validação frontend (campos obrigatórios)
3. Insert em avaliacoes_publicas com aprovado=true
4. Feedback de sucesso
5. Recarrega lista de avaliações
6. Nova avaliação aparece no topo
```

## Troubleshooting

### Curtidas não funcionam:
1. Verificar se migração foi executada
2. Verificar RLS policies
3. Verificar console do navegador
4. Verificar se trabalho tem ID válido

### Avaliações não aparecem:
1. Verificar tabela avaliacoes_publicas
2. Verificar campo aprovado=true
3. Verificar ordem (criado_em DESC)
4. Limpar cache do navegador

## Conclusão

Sistema completo de engajamento social implementado com sucesso! Usuários podem interagir livremente com o conteúdo, aumentando o engajamento e a prova social da barbearia.
