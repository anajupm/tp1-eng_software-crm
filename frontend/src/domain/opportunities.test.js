import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareOpportunity, validateOpportunity } from './opportunities.js';

const clients = [{ id: 1 }];
const draft = { title: ' Consultoria ', client_id: '1', value: '1250.50', stage: 'new', notes: ' Contexto ' };

test('normaliza valores e preserva o identificador do cliente', () => {
  assert.deepEqual(prepareOpportunity(draft, clients), {
    title: 'Consultoria', client_id: 1, value: 1250.5, stage: 'new', notes: 'Contexto', expected_close_date: null,
  });
});
test('impede cliente inexistente, título vazio e etapa inválida', () => {
  const errors = validateOpportunity({ ...draft, title: '  ', client_id: 99, stage: 'unknown' }, clients);
  assert.deepEqual(Object.keys(errors), ['title', 'client_id', 'stage']);
});
test('rejeita valores ausentes, negativos, não finitos e frações de centavo', () => {
  for (const value of ['', ' ', -1, Infinity, 'abc', '1.001', 1000000000]) {
    assert.ok(validateOpportunity({ ...draft, value }, clients).value, String(value));
  }
  assert.equal(validateOpportunity({ ...draft, value: '0' }, clients).value, undefined);
});
test('rejeita datas impossíveis e aceita uma data válida', () => {
  for (const expected_close_date of ['2026-02-30', '2026-13-01', 'abc']) {
    assert.ok(validateOpportunity({ ...draft, expected_close_date }, clients).expected_close_date);
  }
  assert.equal(validateOpportunity({ ...draft, expected_close_date: '2028-02-29' }, clients).expected_close_date, undefined);
});
