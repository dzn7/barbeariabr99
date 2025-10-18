# 📋 Instruções - Novas Funcionalidades do Dashboard

## ✅ Correções Aplicadas

### 1. **Loop de Redirecionamento Corrigido**
- ❌ **Problema:** Ao acessar `/dashboard`, ocorria loop infinito de redirecionamento
- ✅ **Solução:** Middleware agora permite acesso direto a `/dashboard/login`

### 2. **Autenticação via Cookie**
- ✅ Login salva cookie `admin_autenticado` para o middleware detectar
- ✅ Logout limpa o cookie corretamente

---

## 🆕 Novas Funcionalidades

### **1. Gestão de Serviços** (Aba "Serviços")
- ✏️ **Editar preços** dos serviços
- 📊 **Histórico de alterações** (preço anterior, data da mudança)
- 📈 **Indicador de variação** (% de aumento/redução)
- ⏱️ **Editar duração** dos serviços

### **2. Remarcação de Agendamentos** (Aba "Remarcação")
- 📅 **Alterar data/hora** de agendamentos futuros
- 📱 **Notificação automática via WhatsApp** para o cliente
- 📝 **Adicionar motivo** da remarcação (opcional)
- 📊 **Histórico completo** de alterações

---

## 🗄️ Configuração do Banco de Dados

### **Passo 1: Executar SQL no Supabase**

1. Acesse o **Supabase Dashboard**: https://supabase.com
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo: `supabase-dashboard-updates.sql`
5. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

### **O que o SQL faz:**

#### **Tabelas Criadas:**
- ✅ `historico_agendamentos` - Registra todas as alterações de agendamentos

#### **Campos Adicionados:**
- ✅ `servicos.preco_anterior` - Armazena preço anterior
- ✅ `servicos.data_alteracao_preco` - Data da última alteração
- ✅ `servicos.alterado_por` - Quem alterou o preço

#### **Triggers e Funções:**
- ✅ Trigger automático para registrar alterações de agendamentos
- ✅ View `vw_agendamentos_com_historico` para consultas facilitadas

#### **Segurança:**
- ✅ RLS (Row Level Security) configurado
- ✅ Políticas de acesso definidas

---

## 🚀 Como Usar

### **1. Acessar o Dashboard**
```
http://localhost:3000/dashboard
```

**Credenciais:**
- Usuário: `admin`
- Senha: `1503`

### **2. Editar Preços de Serviços**

1. Acesse a aba **"Serviços"**
2. Clique em **"Editar"** no serviço desejado
3. Altere o preço, duração ou nome
4. Clique em **"Salvar"**
5. ✅ O sistema salva automaticamente o preço anterior

### **3. Remarcar Agendamento**

1. Acesse a aba **"Remarcação"**
2. Clique em **"Remarcar"** no agendamento desejado
3. Selecione a **nova data e horário**
4. (Opcional) Adicione um **motivo**
5. Clique em **"Remarcar e Notificar"**
6. ✅ O cliente recebe automaticamente uma mensagem no WhatsApp

**Exemplo de mensagem enviada:**
```
🔄 *Agendamento Remarcado*

Olá Felipe!

Seu agendamento foi remarcado:

📅 *Nova Data:* 15/10/2025 às 14:00
✂️ *Serviço:* Corte Degradê
👤 *Barbeiro:* João Silva
💰 *Valor:* R$ 25,00

📝 *Motivo:* Conflito de agenda

Qualquer dúvida, entre em contato!

_Barbearia BR99_
```

---

## 🔧 Requisitos

### **Bot WhatsApp deve estar rodando:**
```bash
cd barbearia-bot
npm start
```

O bot deve estar **conectado** e **online** para enviar notificações.

---

## 📊 Estrutura de Dados

### **Histórico de Agendamentos**
```sql
historico_agendamentos (
  id                    UUID PRIMARY KEY
  agendamento_id        UUID → agendamentos(id)
  data_hora_anterior    TIMESTAMP
  data_hora_nova        TIMESTAMP
  motivo                TEXT
  alterado_por          TEXT
  data_alteracao        TIMESTAMP
  cliente_notificado    BOOLEAN
)
```

### **Serviços (campos novos)**
```sql
servicos (
  ...campos existentes...
  preco_anterior           DECIMAL(10,2)
  data_alteracao_preco     TIMESTAMP
  alterado_por             TEXT
)
```

---

## 🎯 Funcionalidades Técnicas

### **Componentes Criados:**
1. `GestaoServicos.tsx` - Gestão de preços e serviços
2. `RemarcacaoAgendamento.tsx` - Remarcação com notificação

### **Integração WhatsApp:**
- Endpoint: `http://localhost:3005/api/mensagens/enviar`
- Método: `POST`
- Body: `{ numero, mensagem }`

### **Segurança:**
- ✅ Middleware protege rotas `/dashboard/*`
- ✅ Cookie `admin_autenticado` necessário
- ✅ RLS ativo no Supabase

---

## 🐛 Troubleshooting

### **Problema: "Loop de redirecionamento"**
✅ **Corrigido!** Limpe os cookies do navegador:
```
Chrome: Ctrl+Shift+Del → Cookies → Limpar
```

### **Problema: "Notificação não enviada"**
Verifique:
1. ✅ Bot WhatsApp está rodando? (`npm start` em `barbearia-bot`)
2. ✅ Bot está conectado? (veja logs no terminal)
3. ✅ Número do cliente está correto? (formato: 5586981125646)

### **Problema: "Erro ao salvar serviço"**
Verifique:
1. ✅ SQL foi executado no Supabase?
2. ✅ Campos `preco_anterior`, `data_alteracao_preco` existem?

---

## 📝 Notas Importantes

1. **Backup:** Sempre faça backup antes de executar SQL em produção
2. **Testes:** Teste primeiro em ambiente de desenvolvimento
3. **Notificações:** Cliente só é notificado se o bot estiver online
4. **Histórico:** Todas as alterações ficam registradas permanentemente

---

## ✅ Checklist de Implementação

- [x] Corrigir loop de redirecionamento
- [x] Criar tabela `historico_agendamentos`
- [x] Adicionar campos em `servicos`
- [x] Criar componente `GestaoServicos`
- [x] Criar componente `RemarcacaoAgendamento`
- [x] Integrar com bot WhatsApp
- [x] Adicionar abas no dashboard
- [x] Testar edição de preços
- [x] Testar remarcação com notificação

---

## 🎉 Pronto!

Agora você tem um dashboard completo com:
- ✅ Edição de preços com histórico
- ✅ Remarcação de agendamentos
- ✅ Notificações automáticas via WhatsApp
- ✅ Segurança e autenticação
- ✅ Interface limpa e responsiva

**Qualquer dúvida, consulte este documento!** 📚
