import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoService } from './demo.js';
import { createApiService } from './api.js';

function memoryStorage() {
  const records = new Map();
  return { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
}

test('criação e atualização de clientes no modo demonstração persistem', async () => {
  const storage = memoryStorage();
  const service = createDemoService(storage);
  const initial = await service.load();
  const created = await service.createClient({
    name: 'Novo Cliente', email: 'novo@crm.com', type: 'lead', company: 'Startup', phone: '11999990000',
  });
  assert.equal(created.name, 'Novo Cliente');
  const updated = await service.updateClient(created.id, {
    name: 'Cliente Atualizado', email: 'novo@crm.com', type: 'client', company: 'Empresa Grande', phone: '11999990000',
  });
  assert.equal(updated.name, 'Cliente Atualizado');
  assert.equal(updated.type, 'client');
  const reloaded = await createDemoService(storage).load();
  assert.equal(reloaded.clients.length, initial.clients.length + 1);
  const found = reloaded.clients.find((c) => c.id === created.id);
  assert.equal(found.name, 'Cliente Atualizado');
});

test('registro de interação no modo demonstração persiste no histórico', async () => {
  const storage = memoryStorage();
  const service = createDemoService(storage);
  const createdInteraction = await service.createInteraction({
    client_id: 1, type: 'call', description: 'Ligação de alinhamento com cliente', occurred_at: '2026-09-29T10:00:00Z',
  });
  assert.equal(createdInteraction.type, 'call');
  const reloaded = await createDemoService(storage).load();
  const found = reloaded.interactions.find((i) => i.id === createdInteraction.id);
  assert.ok(found);
  assert.equal(found.client_id, 1);
});

test('adaptador HTTP encaminha operações de cliente e interação', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, method: options.method, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ id: 42, ...JSON.parse(options.body) }) };
  };
  try {
    const api = createApiService('http://test.api');
    await api.createClient({ name: 'Teste API', email: 'api@crm.com', type: 'lead' });
    await api.updateClient(42, { name: 'Teste PUT', email: 'api@crm.com', type: 'client' });
    await api.createInteraction({ client_id: 42, type: 'email', description: 'Email enviado' });

    assert.equal(calls[0].url, 'http://test.api/clients');
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[1].url, 'http://test.api/clients/42');
    assert.equal(calls[1].method, 'PUT');
    assert.equal(calls[2].url, 'http://test.api/interactions');
    assert.equal(calls[2].method, 'POST');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
