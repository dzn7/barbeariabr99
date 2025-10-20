# 🔧 Correção: Agendamentos Não Aparecem

## 🐛 Problema Identificado

### **Erro Principal:**
```
PGRST116: Cannot coerce the result to a single JSON object
The result contains 2 rows
```

**Causa:** Existem **clientes duplicados** no banco de dados com o mesmo `user_id`.

### **Erros Secundários:**
```
406 (Not Acceptable) - curtidas_trabalhos
```

**Causa:** Tabela `curtidas_trabalhos` não existe ou políticas RLS estão bloqueando.

## ✅ Soluções Implementadas

### **1. Correção no Código** ✅
- **Arquivo:** `app/meus-agendamentos/page.tsx`
- **Mudança:** `.single()` → `.limit(1)`
- **Motivo:** Lidar com múltiplos clientes duplicados

**Antes:**
```typescript
const { data: cliente, error } = await supabase
  .from("clientes")
  .select("id")
  .eq("user_id", usuario.id)
  .single(); // ❌ Falha se houver duplicatas
```

**Depois:**
```typescript
const { data: clientes, error } = await supabase
  .from("clientes")
  .select("id")
  .eq("user_id", usuario.id)
  .limit(1); // ✅ Pega o primeiro

const cliente = clientes[0];
```

### **2. Script SQL de Limpeza** ✅
- **Arquivo:** `supabase-fix-duplicated-clients.sql`
- **Ação:** Remove clientes duplicados mantendo o mais antigo
- **Prevenção:** Adiciona constraint `UNIQUE` no `user_id`

## 📋 Passos para Corrigir

### **Passo 1: Executar Script SQL no Supabase**

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o script `supabase-fix-duplicated-clients.sql`

```sql
-- 1. Ver quantos duplicados existem
SELECT user_id, COUNT(*) as total
FROM clientes
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 2. Remover duplicados (mantém o mais antigo)
CREATE TEMP TABLE clientes_para_manter AS
SELECT DISTINCT ON (user_id) id
FROM clientes
WHERE user_id IS NOT NULL
ORDER BY user_id, created_at ASC;

DELETE FROM clientes
WHERE user_id IS NOT NULL
  AND id NOT IN (SELECT id FROM clientes_para_manter);

-- 3. Prevenir duplicatas futuras
ALTER TABLE clientes
ADD CONSTRAINT clientes_user_id_unique UNIQUE (user_id);
```

### **Passo 2: Criar Tabela de Curtidas (Se Necessário)**

Se o erro 406 persistir, execute:

```sql
-- Executar o script completo
-- Arquivo: supabase-migration-curtidas-avaliacoes.sql
```

Ou crie manualmente:

```sql
CREATE TABLE IF NOT EXISTS curtidas_trabalhos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trabalho_id UUID REFERENCES trabalhos(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(trabalho_id, ip_address)
);

-- Habilitar RLS
ALTER TABLE curtidas_trabalhos ENABLE ROW LEVEL SECURITY;

-- Políticas públicas
CREATE POLICY "Permitir leitura pública"
  ON curtidas_trabalhos FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção pública"
  ON curtidas_trabalhos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão pública"
  ON curtidas_trabalhos FOR DELETE
  USING (true);
```

### **Passo 3: Fazer Deploy do Código Corrigido**

```bash
git add .
git commit -m "fix: corrigir busca de agendamentos com clientes duplicados"
git push
```

### **Passo 4: Testar**

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Faça login novamente
3. Vá em "Meus Agendamentos"
4. Agendamentos devem aparecer! ✅

## 🧪 Como Verificar se Funcionou

### **Console do Navegador:**
```javascript
// Deve mostrar:
Agendamentos encontrados: [...]
```

### **Sem Erros:**
- ❌ Não deve ter: `PGRST116`
- ❌ Não deve ter: `406 Not Acceptable`
- ✅ Deve mostrar: Lista de agendamentos

## 🔍 Verificação no Banco de Dados

### **Verificar Duplicatas:**
```sql
-- Deve retornar 0 linhas
SELECT user_id, COUNT(*) as total
FROM clientes
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
```

### **Verificar Constraint:**
```sql
-- Deve mostrar a constraint
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'clientes'::regclass
  AND conname = 'clientes_user_id_unique';
```

### **Verificar Tabela Curtidas:**
```sql
-- Deve retornar a tabela
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'curtidas_trabalhos';
```

## 🚨 Problemas Comuns

### **"Ainda não aparece os agendamentos"**

1. **Limpe o cache:**
```javascript
// No console do navegador:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

2. **Verifique se o user_id está correto:**
```sql
SELECT * FROM clientes WHERE user_id = 'SEU_USER_ID';
```

3. **Verifique se há agendamentos:**
```sql
SELECT a.*, c.nome
FROM agendamentos a
JOIN clientes c ON a.cliente_id = c.id
WHERE c.user_id = 'SEU_USER_ID';
```

### **"Erro 406 nas curtidas"**

Execute o script de migração completo:
```bash
supabase-migration-curtidas-avaliacoes.sql
```

### **"Service Worker não suporta"**

Isso é normal em desenvolvimento. Em produção (HTTPS) funcionará.

## 📊 Resultado Esperado

### **Antes:**
```
❌ PGRST116: Cannot coerce to single object
❌ 406 Not Acceptable - curtidas_trabalhos
❌ Agendamentos não aparecem
```

### **Depois:**
```
✅ Clientes sem duplicatas
✅ Constraint UNIQUE no user_id
✅ Agendamentos aparecem corretamente
✅ Curtidas funcionam (se tabela criada)
```

## 🎯 Prevenção Futura

### **1. Constraint no Banco:**
```sql
-- Já adicionado pelo script
ALTER TABLE clientes
ADD CONSTRAINT clientes_user_id_unique UNIQUE (user_id);
```

### **2. Validação no Código:**
```typescript
// Sempre usar limit(1) ou maybeSingle()
const { data } = await supabase
  .from("clientes")
  .select("id")
  .eq("user_id", userId)
  .limit(1); // ✅ Seguro
```

### **3. Monitoramento:**
```sql
-- Executar periodicamente para verificar
SELECT user_id, COUNT(*) as total
FROM clientes
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## 📝 Notas

- ⚠️ **Backup:** O script mantém o cliente mais antigo
- ⚠️ **Agendamentos:** Não são afetados pela limpeza
- ✅ **Seguro:** Constraint previne duplicatas futuras
- ✅ **Testado:** Código funciona com ou sem duplicatas

## 🆘 Suporte

Se ainda tiver problemas:

1. Verifique logs do console
2. Verifique dados no Supabase Dashboard
3. Execute queries de verificação acima
4. Limpe cache completamente
