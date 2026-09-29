import { api } from './api';
import { API_PATHS } from '../config/api';

const unwrap = (data) => data?.serviceOrder ?? data?.order ?? data;

export async function listServiceOrders() {
  const { data } = await api.get(API_PATHS.serviceOrders);
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.serviceOrders || data?.orders || [];
}

export async function listServiceOrdersByCeo(ceoId) {
  const { data } = await api.get(API_PATHS.serviceOrdersByCeo(ceoId));
  if (Array.isArray(data)) return data;
  return data?.content || data?.items || data?.serviceOrders || data?.orders || [];
}

export async function getServiceOrder(serviceOrderId) {
  const { data } = await api.get(API_PATHS.serviceOrderById(serviceOrderId));
  return unwrap(data);
}

export async function createServiceOrder({ ceoId, ceoStatus, userId, statusDescription }) {
  const payload = {
    ceo: { id: Number(ceoId) },
    ceoStatus,
    status: 'OPEN',
    user: { id: Number(userId) },
    serviceOrderStatusDescriptions: statusDescription.trim()
      ? [{ statusDescription: statusDescription.trim() }]
      : [],
  };

  const { data } = await api.post(API_PATHS.openServiceOrder, payload);
  return unwrap(data);
}

export async function completeServiceOrderAttendance(serviceOrderId, { status, statusDescription, geoLocation }) {
  const { data } = await api.post(API_PATHS.serviceOrderAttendance(serviceOrderId), {
    status,
    statusDescription,
    geoLocation,
  });
  return unwrap(data);
}
