// ========================================================
// SERVICE WORKER - ALERTA CRÍTICA E ICONO OFICIAL PWA (v4)
// ========================================================

// 1. PASO 3: Registro de archivos esenciales en la memoria interna (Caché)
const CACHE_NAME = 'control-meds-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://images.t2.ai/direct/1000093550.png' // Tu logo oficial limpio configurado como icono
];

let intervaloAlarma = null;

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuchar la orden de alerta desde el index.html
self.addEventListener('message', (event) => {
  if (event.data.accion === 'iniciarAlarmaInfinita') {
    const { nombre, dosis, url } = event.data;
    
    // Limpiar cualquier bucle de alarma previo
    clearInterval(intervaloAlarma);

    // BOMBARDEO VISUAL Y DE VIBRACIÓN: Se ejecuta cada 3 segundos sin parar
    intervaloAlarma = setInterval(() => {
      const ahora = new Date();
      const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

      self.registration.showNotification(`🚨 ¡ALERTA DE MEDICAMENTO CRÍTICA!`, {
        body: `TOMAR AHORA: ${nombre}\nDOSIS: ${dosis}\nHora: ${horaActual} hrs.\n\n⚠️ Despliega o toca para atender de inmediato.`,
        icon: 'https://images.t2.ai/direct/1000093550.png', // Logo oficial limpio en la alerta
        badge: 'https://images.t2.ai/direct/1000093550.png', // Icono para la barra de notificaciones superior
        
        // Patrón de vibración masivo y rítmico (Vibra 500ms, frena 200ms...)
        vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 500, 200], 
        
        tag: 'alarma-critica-vibrante', // Sobrescribe la alerta anterior para forzar la vibración del celular
        renotify: true,                 // Obliga al teléfono a reaccionar en cada repetición
        requireInteraction: true,       // Mantiene la ventana flotante visible en pantalla
        data: { url: url },
        
        // Botones de acción rápida directo en la notificación flotante del móvil
        actions: [
          { action: 'confirmar', title: '✅ Ya lo tomé' },
          { action: 'abrir', title: '📱 Abrir Aplicación' }
        ]
      });
    }, 3000); 
  }
});

// Manejar los clics en la notificación o en sus botones directos
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Quita la notificación de la pantalla del móvil
  
  // Detenemos la ráfaga repetitiva de mensajes y vibraciones de inmediato
  clearInterval(intervaloAlarma);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Avisar a la pestaña de la aplicación que la alerta se detuvo para apagar la sirena
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          client.postMessage({ accion: 'alertaAtendida' });
          return client.focus();
        }
      }
      // Si la aplicación estaba cerrada en el fondo, la abre desde cero
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
