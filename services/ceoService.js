import { api } from './api';
import { API_PATHS } from '../config/api';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.ceos)) return data.ceos;

  // GET /api/ceo/v1 devolve um CollectionModel do Spring HATEOAS, cuja
  // chave dentro de "_embedded" é gerada a partir do nome da classe do DTO
  // (hoje "cEODTOList", por causa de "CEODTO") — em vez de apostar nesse
  // nome, pegamos o primeiro array que existir ali dentro.
  if (data?._embedded) {
    const embeddedList = Object.values(data._embedded).find((value) => Array.isArray(value));
    if (embeddedList) return embeddedList;
  }

  if (data?.id !== undefined || data?.boxNumber !== undefined) return [data];
  return [];
}

function unwrapOne(data) {
  return data?.content ?? data?.ceo ?? data;
}

export async function listCeos(query = '') {
  const value = String(query).trim();
  if (!value) {
    // GET /api/ceo/v1 agora é paginado (padrão de 20 por página); a tela
    // de listagem usa a visão "sem busca" pra destacar CEOs que precisam
    // de atenção, então pedimos uma página bem maior pra não perder itens
    // que estariam em páginas seguintes. Se a base de CEOs crescer muito
    // além disso, o ideal passa a ser um filtro de status no backend.
    const response = await api.get(API_PATHS.ceosPage(0, 200));
    return unwrapList(response.data);
  }

  if (/^\d+$/.test(value)) {
    try {
      const response = await api.get(API_PATHS.ceoById(value));
      return unwrapList(response.data);
    } catch {
      const response = await api.get(API_PATHS.ceoByBoxNumber(value));
      return unwrapList(response.data);
    }
  }

  const response = await api.get(API_PATHS.ceoByBoxNumber(value));
  return unwrapList(response.data);
}

export async function getCeo(ceoId) {
  const response = await api.get(API_PATHS.ceoById(ceoId));
  return unwrapOne(response.data);
}

export async function createCeo(ceo) {
  const response = await api.post(API_PATHS.ceos, ceo);
  return unwrapOne(response.data);
}

// A API expõe atualização de CEO em PUT /api/ceo/v1/id/{id} — o mesmo
// caminho usado para buscar por id.
export async function updateCeo(ceoId, ceo) {
  const response = await api.put(API_PATHS.ceoById(ceoId), ceo);
  return unwrapOne(response.data);
}
