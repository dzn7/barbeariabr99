/**
 * Service Worker - Cliente
 * Barbearia BR99 - Área Pública
 */

importScripts('/pwa-config.js');

const { VERSION, CACHE_NAMES, STATIC_ASSETS_CLIENT } = self.PWA_CONFIG;

console.log(`[SW Cliente] Versão ${VERSION} inicializada`);

// ============================================
// INSTALAÇÃO - Cache de arquivos estáticos
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW Cliente] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then((cache) => {
        console.log('[SW Cliente] Cache estático criado');
        return cache.addAll(STATIC_ASSETS_CLIENT);
      })
      .then(() => {
        console.log('[SW Cliente] Arquivos em cache');
        return self.skipWaiting(); // Ativa imediatamente
      })
      .catch((error) => {
        console.error('[SW Cliente] Erro ao instalar:', error);
      })
  );
});

// ============================================
// ATIVAÇÃO - Limpeza de caches antigos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW Cliente] Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remove caches que não estão na versão atual
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('[SW Cliente] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW Cliente] Ativado e pronto!');
        return self.clients.claim(); // Assume controle imediatamente
      })
  );
});

// ============================================
// FETCH - Estratégia de cache
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignora requisições de outros domínios
  if (url.origin !== location.origin) {
    return;
  }
  
  // Ignora requisições do dashboard
  if (url.pathname.startsWith('/dashboard')) {
    return;
  }
  
  // Ignora requisições de API
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    return;
  }
  
  event.respondWith(
    networkFirst(request)
  );
});

// ============================================
// ESTRATÉGIAS DE CACHE
// ============================================

/**
 * Network First - Prioriza rede, fallback para cache
 * Garante que sempre tenta buscar conteúdo atualizado
 */
async function networkFirst(request) {
  try {
    // Tenta buscar da rede primeiro
    console.log('[SW Cliente] Buscando da rede:', request.url);
    const networkResponse = await fetch(request);
    
    // Salva no cache se for sucesso
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(
        isImageRequest(request) ? CACHE_NAMES.IMAGES : CACHE_NAMES.DYNAMIC
      );
      cache.put(request, networkResponse.clone());
      console.log('[SW Cliente] Atualizado no cache:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW Cliente] Rede falhou, tentando cache:', request.url);
    
    // Se a rede falhar, tenta buscar do cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW Cliente] Servindo do cache (offline):', request.url);
      return cachedResponse;
    }
    
    // Se não tiver em cache, retorna página offline
    const offlinePage = await caches.match('/');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Resposta de erro genérica
    return new Response('Offline - Sem conexão com a internet', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Verifica se é uma requisição de imagem
 */
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

// ============================================
// MENSAGENS - Comunicação com a aplicação
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW Cliente] Pulando espera...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});
