import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { componentEnvironment } from './opportunity-test-support.js';

test('US06: solicita a etapa para a oportunidade correta e bloqueia o seletor enquanto salva', async (context) => {
  const { load, render, user } = await componentEnvironment(context);
  const OpportunityCard = await load('OpportunityCard');
  const onStageChange = context.mock.fn();
  const opportunity = { id: 42, title: 'Projeto Alfa', value: 100, stage: 'new', expected_close_date: null };
  const props = { opportunity, client: { id: 7, name: 'Cliente Alfa' }, busy: false, onStageChange };
  const view = render(createElement(OpportunityCard, props));
  const select = view.getByRole('combobox', { name: 'Etapa de Projeto Alfa' });
  assert.equal(select.value, 'new');
  await user.selectOptions(select, 'lost');
  assert.deepEqual(onStageChange.mock.calls[0].arguments, [42, 'lost']);

  // O componente pai controla o estado pendente e a etapa confirmada pela API.
  view.rerender(createElement(OpportunityCard, { ...props, busy: true }));
  assert.equal(select.disabled, true);
  await user.selectOptions(select, 'won');
  assert.equal(onStageChange.mock.callCount(), 1);

  view.rerender(createElement(OpportunityCard, { ...props, opportunity: { ...opportunity, stage: 'lost' } }));
  assert.equal(select.disabled, false);
  assert.equal(select.value, 'lost');
});
