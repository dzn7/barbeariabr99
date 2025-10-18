# ✅ Atualização de URLs - Bot WhatsApp

## Mudanças Realizadas

Todas as referências de `localhost:3005` foram substituídas pela URL real do bot no Fly.io.

### Arquivos Modificados

#### 1. **`components/dashboard/GestaoAgendamentos.tsx`**
```typescript
// ANTES
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3005';

// DEPOIS
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://barbearia-bot.fly.dev';
```

#### 2. **`components/dashboard/ModalRemarcacao.tsx`**
```typescript
// ANTES
await fetch("http://localhost:3005/api/mensagens/enviar", {...})

// DEPOIS
const BOT_URL = process.env.NEXT_PUBLIC_BOT_URL || 'https://barbearia-bot.fly.dev';
await fetch(`${BOT_URL}/api/mensagens/enviar`, {...})
```

## Configuração Recomendada

### Arquivo `.env.local` (criar na raiz do projeto)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui

# Bot WhatsApp (Fly.io)
NEXT_PUBLIC_BOT_URL=https://barbearia-bot.fly.dev
```

## Benefícios

✅ **Produção**: Dashboard usa automaticamente a URL do Fly.io
✅ **Desenvolvimento**: Pode sobrescrever com `.env.local` se necessário
✅ **Fallback inteligente**: Se a variável não existir, usa Fly.io por padrão
✅ **Sem hardcode**: Fácil de mudar se migrar para outro servidor

## Como Testar

1. **Reinicie o servidor de desenvolvimento**:
   ```bash
   cd barbeariabr99
   npm run dev
   ```

2. **Teste a remarcação**:
   - Acesse o dashboard
   - Remarque um agendamento
   - Verifique se a mensagem chega no WhatsApp com o horário correto

3. **Verifique os logs do navegador**:
   - Abra o DevTools (F12)
   - Veja se não há erros de conexão
   - Confirme que está usando `https://barbearia-bot.fly.dev`

## Status do Bot

Para verificar se o bot está online:

```bash
curl https://barbearia-bot.fly.dev/health
```

Resposta esperada:
```json
{
  "status": "online",
  "servico": "Barbearia WhatsApp Bot",
  "timestamp": "2025-10-18T12:50:30.119Z"
}
```

## Troubleshooting

### Erro: "Bot não está conectado"

1. Verifique se o bot está online:
   ```bash
   curl https://barbearia-bot.fly.dev/health
   ```

2. Verifique os logs do bot:
   ```bash
   flyctl logs --app barbearia-bot
   ```

3. Reinicie o bot se necessário:
   ```bash
   flyctl apps restart barbearia-bot
   ```

### Mensagens ainda mostram localhost

1. Limpe o cache do Next.js:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. Verifique se a variável de ambiente está configurada:
   ```bash
   echo $NEXT_PUBLIC_BOT_URL
   ```

## Próximos Passos

- [ ] Testar remarcação de agendamento
- [ ] Testar envio de lembretes
- [ ] Verificar horários nas mensagens (devem estar corretos agora)
- [ ] Configurar `.env.local` em produção (Vercel/Netlify)
