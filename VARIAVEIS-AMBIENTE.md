# 🔧 Variáveis de Ambiente

## Configuração Necessária

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Bot WhatsApp (Fly.io)
NEXT_PUBLIC_BOT_URL=https://barbearia-bot.fly.dev
```

## Descrição das Variáveis

### `NEXT_PUBLIC_SUPABASE_URL`
- **Descrição**: URL do projeto Supabase
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project URL
- **Exemplo**: `https://xxxxxxxxxxx.supabase.co`

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Descrição**: Chave anônima do Supabase (pública)
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project API keys → anon/public
- **Exemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### `NEXT_PUBLIC_BOT_URL`
- **Descrição**: URL do bot WhatsApp hospedado no Fly.io
- **Produção**: `https://barbearia-bot.fly.dev`
- **Desenvolvimento local**: `http://localhost:3005`
- **Nota**: Esta variável é usada para enviar mensagens de remarcação e lembretes

## Ambientes

### Produção (Padrão - Recomendado)
```bash
NEXT_PUBLIC_BOT_URL=https://barbearia-bot.fly.dev
```

### Desenvolvimento Local (Opcional)
```bash
# Apenas se estiver rodando o bot localmente
NEXT_PUBLIC_BOT_URL=http://localhost:3005
```

## Como Configurar

1. **Copie o arquivo de exemplo**:
   ```bash
   cp .env.example .env.local
   ```

2. **Preencha as variáveis** com os valores corretos

3. **Reinicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## Verificação

Para verificar se as variáveis estão configuradas corretamente:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Bot URL:', process.env.NEXT_PUBLIC_BOT_URL);
```

## Segurança

⚠️ **IMPORTANTE**:
- Nunca commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já está no `.gitignore`
- As variáveis `NEXT_PUBLIC_*` são expostas no cliente (navegador)
- Não coloque chaves secretas em variáveis `NEXT_PUBLIC_*`

## Troubleshooting

### Erro: "Bot não está conectado"
- Verifique se `NEXT_PUBLIC_BOT_URL` está configurado corretamente
- Teste a URL do bot: `curl https://barbearia-bot.fly.dev/health`

### Erro: "Supabase connection failed"
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos
- Confirme que o projeto Supabase está ativo

### Variáveis não carregam
- Reinicie o servidor de desenvolvimento (`npm run dev`)
- Verifique se o arquivo `.env.local` está na raiz do projeto
- Confirme que as variáveis começam com `NEXT_PUBLIC_`
