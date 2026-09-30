import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoService, STORAGE_KEY } from './demo.js';

function memoryStorage() {
  const records = new Map();
  return { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
}
const draft = { title: 'Verificação', client_id: 1, value: 200, stage: 'new' };

test('criação e mudança de etapa sobrevivem à recriação do serviço', async () => {
  const storage = memoryStorage();
  const service = createDemoService(storage);
  const before = await service.load();
  const created = await service.createOpportunity(draft);
  await service.changeStage(created.id, 'won');
  const after = await createDemoService(storage).load();
  assert.equal(after.opportunities.length, before.opportunities.length + 1);
  assert.equal(after.opportunities.find((item) => item.id === created.id).stage, 'won');
  assert.equal(after.clients.length, before.clients.length);
});
test('não salva transições ou registros inválidos', async () => {
  const storage = memoryStorage();
  const service = createDemoService(storage);
  await assert.rejects(service.changeStage('demo-1', 'invalid'), /Etapa inválida/);
  await assert.rejects(service.changeStage('missing', 'won'), /não encontrada/);
  await assert.rejects(service.createOpportunity({ ...draft, client_id: 999 }), /cliente/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
test('sinaliza falha de armazenamento sem informar sucesso', async () => {
  const service = createDemoService({ getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); } });
  await assert.rejects(service.createOpportunity(draft), /Não foi possível salvar/);
});
test('dados corrompidos geram erro e não são substituídos silenciosamente', async () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{broken');
  await assert.rejects(createDemoService(storage).load(), /inválidos/);
  assert.equal(storage.getItem(STORAGE_KEY), '{broken');
});
