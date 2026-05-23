// ========================================================
// SERVICE WORKER - ALERTA DE IMPACTO VISUAL EN CADENA (v5)
// ========================================================

const CACHE_NAME = 'control-meds-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://images.t2.ai/direct/1000093550.png'
];

let datosAlarmaActiva = null;
let alarmaCancelada = false;

self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Escuchar la orden de arranque desde el index.html
self.addEventListener('message', (event) => {
  if (event.data.accion === 'iniciarAlarmaInfinita') {
    alarmaCancelada = false;
    datosAlarmaActiva = event.data;
    // Lanzar la primera pieza del dominó
    dispararNotificacionEnCadena();
  }
  if (event.data.accion === 'detenerAlarmaTotal') {
    alarmaCancelada = true;
    clearInterval(self.intervaloFallback);
  }
});

// FUNCIÓN CLAVE: Lanza una notificación y agenda la siguiente de forma agresiva
function dispararNotificacionEnCadena() {
  if (alarmaCancelada || !datosAlarmaActiva) return;

  const { nombre, dosis, url } = datosAlarmaActiva;
  const ahora = new Date();
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

  self.registration.showNotification(`🚨 ¡ALERTA CRÍTICA DE MEDICAMENTO!`, {
    body: `TOMAR AHORA: ${nombre}\nDOSIS: ${dosis}\nHora: ${horaActual} hrs.\n\n⚠️ Atienda este aviso de inmediato de forma obligatoria.`,
    icon: 'https://images.t2.ai/direct/1000093550.png',
    badge: 'https://images.t2.ai/direct/1000093550.png',
    
    // Vibración extrema rítmica para llamar la atención
    vibrate: [600, 300, 600, 300, 600, 300, 1000], 
    
    tag: 'alarma-interrupción-urgente', // Mismo tag reemplaza la ventana anterior en pantalla
    renotify: true,                    // Fuerza al teléfono a reproducir el sonido CADA VEZ
    requireInteraction: true,          // Mantiene la ventana flotante arriba fija en la pantalla
    data: { url: url },
    actions: [
      { action: 'confirmar', title: '✅ Ya lo tomé' },
      { action: 'abrir', title: '📱 Abrir Sistema' }
    ]
  });

  // ENCADENAMIENTO: Forzar al sistema a ejecutar otra alerta en 3 segundos
  // Aunque el navegador intente dormir el script, el temporizador se mantiene vivo por la notificación activa
  setTimeout(() => {
    dispararNotificacionEnCadena();
  }, 3500);
}

// Controlar las acciones de los botones flotantes
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  alarmaCancelada = true; // Detiene la ráfaga de inmediato

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          client.postMessage({ accion: 'alertaAtendida' });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url).then(windowClient => {
          // Esperar a que abra y mandarle la orden de detener
          setTimeout(() => {
            if(windowClient) windowClient.postMessage({ accion: 'alertaAtendida' });
          }, 1000);
        });
      }
    })
  );
});
