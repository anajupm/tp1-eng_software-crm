import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiService } from './api.js';

test('encaminha criação e mudança de etapa ao contrato proposto', async (context) => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify({ id: 7, ...JSON.parse(options.body) }), { status: 200 });
  });
  const service = createApiService('http://example.test/');
  const created = await service.createOpportunity({ title: 'Proposta', client_id: 1, value: 20, stage: 'new' });
  await service.changeStage(created.id, 'won');
  assert.equal(calls[0].url, 'http://example.test/opportunities');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[1].url, 'http://example.test/opportunities/7');
  assert.equal(calls[1].method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].body), { stage: 'won' });
});
test('falhas do servidor são expostas, sem fallback para demonstração', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 500 }));
  await assert.rejects(createApiService('http://example.test').load(), /HTTP 500/);
});
test('rejeita listas com envelope incompatível', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('{"items":[]}'));
  await assert.rejects(createApiService('http://example.test').load(), /devem retornar listas/);
});

test('carrega contatos, oportunidades e interações persistidas pela API', async (context) => {
  const responses = new Map([
    ['http://example.test/contacts', [{ id: 3, name: 'Cliente' }]],
    ['http://example.test/opportunities', [{ id: 9, client_id: 3, stage: 'new' }]],
    ['http://example.test/contacts/3/interactions', [{ id: 4, contact_id: 3, type: 'call' }]],
  ]);
  context.mock.method(globalThis, 'fetch', async (url) => new Response(JSON.stringify(responses.get(url))));

  const data = await createApiService('http://example.test').load();

  assert.equal(data.clients[0].id, 3);
  assert.equal(data.opportunities[0].id, 9);
  assert.equal(data.interactions[0].client_id, 3);
});
