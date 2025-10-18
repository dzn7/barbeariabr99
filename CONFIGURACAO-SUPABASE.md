# 🔧 Configuração do Supabase para Autenticação

## ❌ Erro: "Database error saving new user"

Este erro acontece quando há triggers ou configurações problemáticas no Supabase.

## 📝 PASSO A PASSO PARA CORRIGIR:

### **1. Limpar Triggers Antigos**
Execute no SQL Editor (nesta ordem):

```sql
-- Arquivo: supabase-limpar-triggers.sql
```

Execute o conteúdo do arquivo `supabase-limpar-triggers.sql`

### **2. Configurar Autenticação no Dashboard**

Acesse: **Authentication → Settings**

#### **Email Auth**
- ✅ Enable Email provider
- ✅ Enable Email Signups (permitir cadastros)

#### **Email Confirmations** (IMPORTANTE!)
- ❌ **DESABILITE** "Confirm email" para desenvolvimento
- Ou configure corretamente para produção

#### **Site URL**
```
http://localhost:3000
```

#### **Redirect URLs**
```
http://localhost:3000/**
```

### **3. Desabilitar Confirmação de Email (Desenvolvimento)**

No SQL Editor, execute:

```sql
-- Desabilitar confirmação de email
UPDATE auth.config 
SET enable_signup = true;

-- Verificar configuração
SELECT * FROM auth.config;
```

### **4. Verificar Políticas RLS**

Execute no SQL Editor:

```sql
-- Ver políticas da tabela clientes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clientes';
```

### **5. Testar Criação Manual de Usuário**

No SQL Editor:

```sql
-- Testar se consegue inserir usuário (NÃO EXECUTAR - APENAS TESTE)
-- Se der erro aqui, o problema é nas políticas
SELECT auth.uid();
```

### **6. Reinstalar Schema Completo (Último Recurso)**

Se nada funcionar:

1. Backup dos dados existentes
2. Execute o script completo: `supabase-schema-completo.sql`
3. Execute: `supabase-autenticacao-usuarios-simples.sql`

## 🧪 TESTAR A CONFIGURAÇÃO

### **Teste 1: Criar usuário via Dashboard**

1. Vá em **Authentication → Users**
2. Clique em "Add User"
3. Crie um usuário de teste
4. Se funcionar, o problema é no código
5. Se falhar, o problema é na configuração do Supabase

### **Teste 2: Verificar Logs**

1. Vá em **Logs → Postgres Logs**
2. Filtre por "error"
3. Procure por mensagens relacionadas a "clientes" ou "auth"

### **Teste 3: Desabilitar RLS Temporariamente**

```sql
-- APENAS PARA TESTE - NÃO USE EM PRODUÇÃO
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;

-- Depois de testar, reabilite:
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
```

## ✅ CONFIGURAÇÃO RECOMENDADA (Desenvolvimento)

```sql
-- 1. Limpar tudo
\i supabase-limpar-triggers.sql

-- 2. Configurar autenticação básica
\i supabase-autenticacao-usuarios-simples.sql

-- 3. Desabilitar confirmação de email (dev)
-- Faça isso no Dashboard: Authentication → Settings → Disable "Confirm email"
```

## 🔐 CONFIGURAÇÃO RECOMENDADA (Produção)

```sql
-- 1. Mesmos passos acima

-- 2. Habilitar confirmação de email
-- Dashboard: Authentication → Settings → Enable "Confirm email"

-- 3. Configurar Email Templates
-- Dashboard: Authentication → Email Templates

-- 4. Configurar URLs de produção
-- Site URL: https://seudominio.com
-- Redirect URLs: https://seudominio.com/**
```

## 📞 SE AINDA NÃO FUNCIONAR

Entre em contato e compartilhe:

1. Print dos logs em **Postgres Logs**
2. Print das configurações em **Authentication → Settings**
3. Lista de triggers: 
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;
```
