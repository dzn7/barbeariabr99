/**
 * Service Worker - Dashboard
 * Barbearia BR99 - Área Administrativa
 */

importScripts('/pwa-config.js');

const { VERSION, CACHE_NAMES, STATIC_ASSETS_DASHBOARD } = self.PWA_CONFIG;

console.log(`[SW Dashboard] Versão ${VERSION} inicializada`);

// ============================================
// INSTALAÇÃO - Cache de arquivos estáticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW Dashboard] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then((cache) => {
        console.log('[SW Dashboard] Cache estático criado');
        return cache.addAll(STATIC_ASSETS_DASHBOARD);
      })
      .then(() => {
        console.log('[SW Dashboard] Arquivos em cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW Dashboard] Erro ao instalar:', error);
      })
  );
});

// ============================================
// ATIVAÇÃO - Limpeza de caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW Dashboard] Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('[SW Dashboard] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW Dashboard] Ativado e pronto!');
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH - Estratégia Network First
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora requisições de outros domínios
  if (url.origin !== location.origin) {
    return;
  }
  
  // Apenas processa requisições do dashboard
  if (!url.pathname.startsWith('/dashboard')) {
    return;
  }
  
  // Ignora requisições de API (sempre busca da rede)
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    return;
  }
  
  // Dashboard usa Network First (dados sempre atualizados)
  event.respondWith(
    networkFirst(request)
  );
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================

/**
 * Network First - Prioriza rede, fallback para cache
 * Ideal para dashboard onde dados precisam estar atualizados
 */
async function networkFirst(request) {
  try {
    // Tenta buscar da rede primeiro
    console.log('[SW Dashboard] Buscando da rede:', request.url);
    const networkResponse = await fetch(request);
    
    // Atualiza cache com resposta da rede
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAMES.DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW Dashboard] Rede falhou, buscando do cache:', request.url);
    
    // Se rede falhar, busca do cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retorna página offline se disponível
    const offlinePage = await caches.match('/dashboard');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Resposta de erro
    return new Response('Dashboard offline - Sem conexão', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// ============================================
// NOTIFICAÇÕES PUSH
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Dashboard] Notificação clicada:', event.notification.tag);
  
  event.notification.close();
  
  // Abrir ou focar na janela do dashboard
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, focar nela
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não tem janela aberta, abrir nova
        const url = event.notification.data?.url || '/dashboard/agendamentos';
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW Dashboard] Notificação fechada:', event.notification.tag);
});

// ============================================
// MENSAGENS - Comunicação com a aplicação
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW Dashboard] Pulando espera...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW Dashboard] Limpando cache...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  // Enviar notificação via mensagem
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('[SW Dashboard] Enviando notificação:', event.data.payload);
    event.waitUntil(
      self.registration.showNotification(event.data.payload.title, {
        body: event.data.payload.body,
        icon: event.data.payload.icon || '/favicon/android-chrome-192x192.png',
        badge: event.data.payload.badge || '/favicon/android-chrome-192x192.png',
        tag: event.data.payload.tag || 'default',
        requireInteraction: event.data.payload.requireInteraction || false,
        data: event.data.payload.data,
        vibrate: [200, 100, 200],
      })
    );
  }
});
