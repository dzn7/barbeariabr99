# 📱 PWA - Barbearia BR99

Sistema de Progressive Web App completo e versionado para a Barbearia BR99.

## 🎯 Visão Geral

A aplicação possui **duas PWAs independentes**:

1. **PWA Cliente** - Área pública (agendamentos, informações)
2. **PWA Dashboard** - Área administrativa (gestão, relatórios)

Cada uma com seu próprio Service Worker, manifest e estratégia de cache.

---

## 📁 Estrutura de Arquivos

```
public/
├── pwa-config.js              # Configuração centralizada (versão, caches)
├── sw-client.js               # Service Worker do cliente
├── sw-dashboard.js            # Service Worker do dashboard
├── manifest-client.json       # Manifest PWA do cliente
├── manifest-dashboard.json    # Manifest PWA do dashboard
└── site.webmanifest          # Manifest legado (compatibilidade)

lib/
└── pwa-register.ts           # Utilitário de registro e gerenciamento

components/
└── PWAUpdateNotification.tsx # Componente de notificação de atualização
```

---

## 🔧 Configuração

### pwa-config.js

Arquivo central que controla:
- **Versão da PWA** (incrementar quando houver mudanças)
- **Nomes dos caches** (versionados automaticamente)
- **Arquivos para cache offline**
- **Tempo de expiração**

```javascript
const PWA_CONFIG = {
  VERSION: '1.0.0',  // ⬅️ INCREMENTAR AQUI
  CACHE_NAMES: {
    STATIC: 'barbearia-br99-static-v1.0.0',
    DYNAMIC: 'barbearia-br99-dynamic-v1.0.0',
    IMAGES: 'barbearia-br99-images-v1.0.0',
  },
  // ...
};
```

---

## 🚀 Como Funciona

### Service Worker Cliente (sw-client.js)

**Estratégia**: Cache First
- Prioriza cache para performance
- Fallback para rede se não estiver em cache
- Ideal para conteúdo estático

**Características**:
- Cache de páginas principais
- Cache de imagens
- Funciona offline
- Ignora requisições do dashboard
- Ignora APIs (sempre busca da rede)

### Service Worker Dashboard (sw-dashboard.js)

**Estratégia**: Network First
- Prioriza rede para dados atualizados
- Fallback para cache se offline
- Ideal para dados dinâmicos

**Características**:
- Sempre busca dados frescos
- Cache como backup
- Funciona offline com dados em cache
- Ignora requisições do cliente
- Ignora APIs (sempre busca da rede)

---

## 🔄 Sistema de Versionamento

### Quando Atualizar a Versão

Incremente a versão em `pwa-config.js` quando:
- ✅ Adicionar/remover arquivos do cache
- ✅ Mudar estratégia de cache
- ✅ Corrigir bugs no Service Worker
- ✅ Adicionar novas funcionalidades PWA

### Processo de Atualização

1. **Edite** `pwa-config.js`:
   ```javascript
   VERSION: '1.0.1',  // Incrementar
   ```

2. **Os caches são atualizados automaticamente**:
   ```javascript
   STATIC: 'barbearia-br99-static-v1.0.1',  // Auto-atualizado
   ```

3. **Deploy** - O novo SW é instalado automaticamente

4. **Usuário é notificado** via `PWAUpdateNotification`

5. **Caches antigos são removidos** automaticamente

---

## 💻 Uso no Código

### Registrar PWA

```typescript
import { registerPWA } from '@/lib/pwa-register';

// Cliente
registerPWA('client', {
  onSuccess: () => console.log('PWA registrada'),
  onUpdate: () => console.log('Atualização disponível'),
  onError: (error) => console.error('Erro:', error),
});

// Dashboard
registerPWA('dashboard', {
  onSuccess: () => console.log('Dashboard PWA registrada'),
});
```

### Verificar Versão

```typescript
import { getPWAVersion } from '@/lib/pwa-register';

const version = await getPWAVersion();
console.log('Versão atual:', version);
```

### Verificar se está Instalada

```typescript
import { isPWAInstalled } from '@/lib/pwa-register';

if (isPWAInstalled()) {
  console.log('Rodando como app instalado');
}
```

### Limpar Cache (Desenvolvimento)

```typescript
import { clearPWACache } from '@/lib/pwa-register';

await clearPWACache();
```

### Monitorar Conectividade

```typescript
import { onConnectivityChange, isOnline } from '@/lib/pwa-register';

// Verifica status
console.log('Online:', isOnline());

// Monitora mudanças
const cleanup = onConnectivityChange(
  () => console.log('Voltou online'),
  () => console.log('Ficou offline')
);

// Limpar listeners
cleanup();
```

---

## 🎨 Componente de Atualização

O componente `PWAUpdateNotification` exibe um banner quando há atualização:

```tsx
<PWAUpdateNotification />
```

**Funcionalidades**:
- ✅ Detecta automaticamente atualizações
- ✅ Banner elegante e não intrusivo
- ✅ Botões "Atualizar Agora" e "Depois"
- ✅ Animações suaves
- ✅ Dark mode

---

## 📦 Manifests

### manifest-client.json
- Nome: "Barbearia BR99"
- Ícone: Logo da barbearia
- Cor: #18181b
- Atalhos: Agendar Horário

### manifest-dashboard.json
- Nome: "BR99 Dashboard"
- Ícone: Logo da barbearia
- Cor: #18181b (dark)
- Atalhos: Agendamentos, Financeiro

---

## 🐛 Debugging

### Console Logs

Os Service Workers logam todas as ações:

```
[SW Cliente] Versão 1.0.0 inicializada
[SW Cliente] Instalando...
[SW Cliente] Cache estático criado
[SW Cliente] Servindo do cache: /assets/logo.PNG
[SW Cliente] Buscando da rede: /api/agendamentos
```

### Ferramentas do Navegador

**Chrome DevTools**:
1. Application → Service Workers
2. Application → Cache Storage
3. Application → Manifest

**Comandos Úteis**:
- Unregister: Remove SW
- Update: Força atualização
- Skip waiting: Ativa novo SW imediatamente

---

## ✅ Checklist de Deploy

Antes de fazer deploy com mudanças na PWA:

- [ ] Incrementar versão em `pwa-config.js`
- [ ] Testar em modo de produção
- [ ] Verificar cache funcionando
- [ ] Testar modo offline
- [ ] Verificar atualização automática
- [ ] Testar em mobile
- [ ] Verificar manifests corretos

---

## 🔒 Segurança

- ✅ Service Workers só funcionam em HTTPS
- ✅ APIs nunca são cacheadas
- ✅ Dados sensíveis sempre da rede
- ✅ Cache versionado previne conflitos
- ✅ Limpeza automática de caches antigos

---

## 📱 Instalação

### Android
1. Abra o site no Chrome
2. Menu → "Adicionar à tela inicial"
3. Confirme

### iOS
1. Abra o site no Safari
2. Compartilhar → "Adicionar à Tela de Início"
3. Confirme

### Desktop
1. Abra o site no Chrome/Edge
2. Ícone de instalação na barra de endereço
3. Clique em "Instalar"

---

## 🎯 Benefícios

✅ **Performance**: Cache inteligente, carregamento instantâneo
✅ **Offline**: Funciona sem internet
✅ **Atualizações**: Sistema automático de versão
✅ **Instalável**: Como app nativo
✅ **Sem Conflitos**: Caches versionados
✅ **Manutenível**: Código limpo e documentado
✅ **Escalável**: Fácil adicionar novas funcionalidades

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Inspecione Service Workers no DevTools
3. Limpe cache se necessário
4. Verifique versão atual

---

**Versão da Documentação**: 1.0.0
**Última Atualização**: 2025-01-18
