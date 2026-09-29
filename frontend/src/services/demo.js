import { clients, interactions, opportunities } from './fixtures.js';
import { prepareOpportunity, STAGES } from '../domain/opportunities.js';
import { prepareClient, prepareInteraction } from '../domain/clients.js';

export const STORAGE_KEY = 'nexocrm.demo.opportunities.v1';
export const CLIENTS_STORAGE_KEY = 'nexocrm.demo.clients.v1';
export const INTERACTIONS_STORAGE_KEY = 'nexocrm.demo.interactions.v1';

export function createDemoService(storage) {
  function read(key, fallback, validator, errorMsg) {
    const saved = storage.getItem(key);
    if (saved === null) return structuredClone(fallback);
    try {
      const records = JSON.parse(saved);
      if (!Array.isArray(records) || (validator && !validator(records))) throw new Error();
      return records;
    } catch {
      throw new Error(errorMsg);
    }
  }
  function write(key, records) {
    try { storage.setItem(key, JSON.stringify(records)); }
    catch { throw new Error('Não foi possível salvar neste navegador. Verifique se o armazenamento local está disponível.'); }
  }
  const readClients = () => read(CLIENTS_STORAGE_KEY, clients, null, 'Os dados de clientes salvos estão inválidos.');
  const readInteractions = () => read(INTERACTIONS_STORAGE_KEY, interactions, null, 'Os dados de interações salvos estão inválidos.');
  const readOpportunities = (currentClients) => read(
    STORAGE_KEY, opportunities,
    (recs) => recs.every((i) => i?.id && currentClients.some((c) => c.id === i.client_id) && typeof i.title === 'string' && Number.isFinite(i.value) && STAGES.some((s) => s.id === i.stage)),
    'Os dados de demonstração salvos estão inválidos. Consulte a seção de recuperação no guia do frontend.'
  );

  return {
    async load() {
      const c = readClients();
      return { clients: c, interactions: readInteractions(), opportunities: readOpportunities(c) };
    },
    async createClient(draft) {
      const c = readClients();
      const nextId = c.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
      const record = { ...prepareClient(draft, c), id: nextId };
      write(CLIENTS_STORAGE_KEY, [...c, record]);
      return record;
    },
    async updateClient(id, draft) {
      const c = readClients();
      const idx = c.findIndex((item) => String(item.id) === String(id));
      if (idx === -1) throw new Error('Cliente não encontrado.');
      const record = { ...c[idx], ...prepareClient(draft, c, id), id: c[idx].id };
      const next = [...c]; next[idx] = record;
      write(CLIENTS_STORAGE_KEY, next);
      return record;
    },
    async createInteraction(draft) {
      const c = readClients();
      const record = { ...prepareInteraction(draft, c), id: crypto.randomUUID() };
      write(INTERACTIONS_STORAGE_KEY, [record, ...readInteractions()]);
      return record;
    },
    async createOpportunity(draft) {
      const c = readClients();
      const record = { ...prepareOpportunity(draft, c), id: crypto.randomUUID(), created_at: new Date().toISOString() };
      write(STORAGE_KEY, [record, ...readOpportunities(c)]);
      return record;
    },
    async changeStage(id, stage) {
      if (!STAGES.some((item) => item.id === stage)) throw new Error('Etapa inválida.');
      const c = readClients();
      const records = readOpportunities(c);
      const current = records.find((item) => String(item.id) === String(id));
      if (!current) throw new Error('Oportunidade não encontrada.');
      const updated = { ...current, stage };
      write(STORAGE_KEY, records.map((item) => item.id === current.id ? updated : item));
      return updated;
    },
  };
}
