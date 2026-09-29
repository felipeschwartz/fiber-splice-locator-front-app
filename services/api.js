import axios from 'axios';
import { API_BASE_URL, API_PATHS } from '../config/api';
import { tokenStorage } from './storage';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  // 45s pra dar tempo de enviar fotos de até 20MB em rede móvel lenta.
  timeout: 45000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token && !config.url?.includes(API_PATHS.login)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error, fallback = 'Não foi possível concluir a operação.') {
  if (!error?.response) return 'Não foi possível conectar ao servidor. Verifique a API e a rede.';
  if (error.response.status === 401) return 'Sessão expirada ou credenciais inválidas.';
  return error.response.data?.message || error.response.data?.error || fallback;
}
