import { clients, interactions, opportunities } from './fixtures.js';
import { prepareOpportunity, STAGES } from '../domain/opportunities.js';

export const STORAGE_KEY = 'nexocrm.demo.opportunities.v1';

export function createDemoService(storage) {
  function read() {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) return structuredClone(opportunities);
    try {
      const records = JSON.parse(saved);
      if (!Array.isArray(records) || records.some((item) => !item || !item.id
        || !clients.some((client) => client.id === item.client_id)
        || typeof item.title !== 'string' || !Number.isFinite(item.value)
        || !STAGES.some((stage) => stage.id === item.stage))) throw new Error();
      return records;
    } catch {
      throw new Error('Os dados de demonstração salvos estão inválidos. Consulte a seção de recuperação no guia do frontend.');
    }
  }
  function write(records) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch { throw new Error('Não foi possível salvar neste navegador. Verifique se o armazenamento local está disponível.'); }
  }
  return {
    async load() {
      return { clients: structuredClone(clients), interactions: structuredClone(interactions), opportunities: read() };
    },
    async createOpportunity(draft) {
      const record = { ...prepareOpportunity(draft, clients), id: crypto.randomUUID(), created_at: new Date().toISOString() };
      write([record, ...read()]);
      return record;
    },
    async changeStage(id, stage) {
      if (!STAGES.some((item) => item.id === stage)) throw new Error('Etapa inválida.');
      const records = read();
      const current = records.find((item) => String(item.id) === String(id));
      if (!current) throw new Error('Oportunidade não encontrada.');
      const updated = { ...current, stage };
      write(records.map((item) => item.id === current.id ? updated : item));
      return updated;
    },
  };
}
