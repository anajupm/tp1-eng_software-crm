import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareClient,
  validateClient,
  prepareInteraction,
  validateInteraction,
  searchClients,
} from './clients.js';

const SAMPLE_CLIENTS = [
  { id: 1, name: 'Ana Silva', email: 'ana@crm.com', type: 'client', company: 'Nexo', phone: '11999991111' },
  { id: 2, name: 'Carlos Lima', email: 'carlos@crm.com', type: 'lead', company: 'Alpha', phone: '11999992222' },
];

test('valida e prepara cliente válido com normalização', () => {
  const prepared = prepareClient({
    name: '  Beatriz Souza  ',
    email: '  BEATRIZ@teste.com ',
    type: 'lead',
    company: ' Beta Corp ',
    phone: ' 31988887777 ',
  }, SAMPLE_CLIENTS);

  assert.equal(prepared.name, 'Beatriz Souza');
  assert.equal(prepared.email, 'beatriz@teste.com');
  assert.equal(prepared.type, 'lead');
  assert.equal(prepared.company, 'Beta Corp');
  assert.equal(prepared.phone, '31988887777');
});

test('rejeita cliente com dados inválidos ou duplicados', () => {
  assert.match(validateClient({ name: '', email: 'valido@crm.com', type: 'lead' }), /nome/);
  assert.match(validateClient({ name: 'João', email: 'email_invalido', type: 'lead' }), /e-mail válido/);
  assert.match(validateClient({ name: 'João', email: 'ana@crm.com', type: 'lead' }, SAMPLE_CLIENTS), /já existe/i);
  assert.match(validateClient({ name: 'João', email: 'novo@crm.com', type: 'invalido' }), /tipo/i);
});

test('permite atualizar cliente mantendo o mesmo e-mail', () => {
  const error = validateClient({
    name: 'Ana Silva Atualizada',
    email: 'ana@crm.com',
    type: 'client',
  }, SAMPLE_CLIENTS, 1);
  assert.equal(error, null);
});

test('valida e prepara registro de interação válido', () => {
  const prepared = prepareInteraction({
    client_id: 1,
    type: 'call',
    description: '  Conversa sobre proposta comercial.  ',
    occurred_at: '2026-09-29T10:00:00Z',
  }, SAMPLE_CLIENTS);

  assert.equal(prepared.client_id, 1);
  assert.equal(prepared.type, 'call');
  assert.equal(prepared.description, 'Conversa sobre proposta comercial.');
  assert.equal(prepared.occurred_at, '2026-09-29T10:00:00.000Z');
});

test('rejeita interação com cliente inexistente, tipo inválido ou vazia', () => {
  assert.match(validateInteraction({ client_id: 999, type: 'call', description: 'Ok' }, SAMPLE_CLIENTS), /cliente válido/i);
  assert.match(validateInteraction({ client_id: 1, type: 'sms', description: 'Ok' }, SAMPLE_CLIENTS), /tipo de contato/i);
  assert.match(validateInteraction({ client_id: 1, type: 'meeting', description: '   ' }, SAMPLE_CLIENTS), /descrição/i);
});

test('filtra clientes por busca textual e lida com busca vazia', () => {
  assert.equal(searchClients(SAMPLE_CLIENTS, '').length, 2);
  assert.equal(searchClients(SAMPLE_CLIENTS, 'silva')[0].id, 1);
  assert.equal(searchClients(SAMPLE_CLIENTS, 'alpha')[0].id, 2);
  assert.equal(searchClients(SAMPLE_CLIENTS, '999991111')[0].id, 1);
  assert.equal(searchClients(SAMPLE_CLIENTS, 'inexistente').length, 0);
});
