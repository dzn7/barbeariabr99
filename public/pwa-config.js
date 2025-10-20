/**
 * Configuração PWA - Barbearia BR99
 * Versão centralizada para controle de cache
 */

const PWA_CONFIG = {
  // Versão da PWA - Incrementar quando houver mudanças
  VERSION: '2.0.0',
  
  // Nome dos caches
  CACHE_NAMES: {
    STATIC: 'barbearia-br99-static-v2.0.0',
    DYNAMIC: 'barbearia-br99-dynamic-v2.0.0',
    IMAGES: 'barbearia-br99-images-v2.0.0',
  },
  
  // Arquivos para cache offline (cliente)
  STATIC_ASSETS_CLIENT: [
    '/',
    '/agendamento',
    '/assets/logo.PNG',
    '/favicon/favicon.ico',
    '/favicon/android-chrome-192x192.png',
    '/favicon/android-chrome-512x512.png',
  ],
  
  // Arquivos para cache offline (dashboard)
  STATIC_ASSETS_DASHBOARD: [
    '/dashboard',
    '/assets/logo.PNG',
    '/favicon/favicon.ico',
  ],
  
  // Tempo de expiração do cache (em segundos)
  CACHE_EXPIRATION: {
    IMAGES: 30 * 24 * 60 * 60, // 30 dias
    STATIC: 7 * 24 * 60 * 60,  // 7 dias
    DYNAMIC: 24 * 60 * 60,     // 1 dia
  },
};

// Exportar para uso nos service workers
if (typeof self !== 'undefined') {
  self.PWA_CONFIG = PWA_CONFIG;
}
