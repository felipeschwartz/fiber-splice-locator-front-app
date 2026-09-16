// Em dev, sem EXPO_PUBLIC_API_BASE_URL definida, cai no alias do emulador
// Android ('10.0.2.2' aponta pro localhost da própria máquina). Pra rodar
// num dispositivo físico na mesma rede, defina EXPO_PUBLIC_API_BASE_URL
// com o IP local da máquina que roda o backend (ex.: 'http://192.168.3.14:8080',
// veja com `ipconfig`) e libere a porta 8080 no firewall / rede "Privada".
// No build de produção (EAS Build), o valor vem de eas.json — é embutido
// no app na hora do build, então precisa apontar pra URL pública do backend.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8080';

export const API_PATHS = {
  login: '/api/auth/v1/login',
  forgotPassword: '/api/auth/v1/forgot-password',
  resetPassword: '/api/auth/v1/reset-password',

  ceos: '/api/ceo/v1',
  ceosPage: (page = 0, size = 200) => `/api/ceo/v1?page=${page}&size=${size}`,
  ceoById: (id) => `/api/ceo/v1/id/${encodeURIComponent(id)}`,
  ceoByBoxNumber: (boxNumber) => `/api/ceo/v1/box-number/${encodeURIComponent(boxNumber)}`,
  ceoSearch: (query) => `/api/ceo/v1/search?q=${encodeURIComponent(query)}`,

  serviceOrders: '/api/service_orders/v1',
  serviceOrdersByCeo: (ceoId) => `/api/service_orders/v1/ceo/${encodeURIComponent(ceoId)}`,
  openServiceOrder: '/api/service_orders/v1/open',
  serviceOrderById: (id) => `/api/service_orders/v1/id/${encodeURIComponent(id)}`,
  updateServiceOrder: (id) => `/api/service_orders/v1/${encodeURIComponent(id)}`,
  serviceOrderAttendance: (id) => `/api/service_orders/v1/${encodeURIComponent(id)}/attendance`,

  serviceOrderPhotos: (id) => `/api/service_order_photos/v1/service-order/${encodeURIComponent(id)}`,
  serviceOrderStatusDescriptions: (id) =>
    `/api/service_orders_status_descriptions/v1/service-order/${encodeURIComponent(id)}`,

  users: '/api/user/v1',
  userSearch: (query) => `/api/user/v1/search?q=${encodeURIComponent(query)}`,
  changeOwnPassword: '/api/user/v1/me/password',

  updatePushToken: '/api/user/v1/me/push-token',
};
