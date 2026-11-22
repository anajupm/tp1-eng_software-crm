import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { componentEnvironment } from './opportunity-test-support.js';

test('US05: bloqueia cadastro inválido e envia a oportunidade corrigida e normalizada', async (context) => {
  const { load, render, user, waitFor } = await componentEnvironment(context);
  const OpportunityForm = await load('OpportunityForm');
  const onSave = context.mock.fn(async () => {});
  const view = render(createElement(OpportunityForm, {
    clients: [{ id: 7, name: 'Cliente Alfa' }], onSave, onClose: () => {},
  }));

  await user.click(view.getByRole('button', { name: 'Criar oportunidade' }));
  assert.equal(onSave.mock.callCount(), 0);
  for (const label of [/^Título/, /^Cliente ou lead/, /^Valor estimado/]) {
    assert.equal(view.getByLabelText(label).getAttribute('aria-invalid'), 'true');
  }
  assert.equal(document.activeElement, view.getByLabelText(/^Título/));

  await user.type(view.getByLabelText(/^Título/), '  Consultoria Alfa  ');
  await user.selectOptions(view.getByLabelText(/^Cliente ou lead/), '7');
  await user.type(view.getByLabelText(/^Valor estimado/), '1250.50');
  await user.selectOptions(view.getByLabelText(/^Etapa/), 'proposal');
  await user.type(view.getByLabelText(/^Observações/), '  Enviar proposta  ');
  await user.click(view.getByRole('button', { name: 'Criar oportunidade' }));

  await waitFor(() => assert.equal(onSave.mock.callCount(), 1));
  assert.deepEqual(onSave.mock.calls[0].arguments, [{
    title: 'Consultoria Alfa', client_id: 7, value: 1250.5, stage: 'proposal',
    expected_close_date: null, notes: 'Enviar proposta',
  }]);
  assert.equal(view.container.querySelectorAll('[aria-invalid="true"]').length, 0);
});
