import test from 'node:test';
import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { startCrm } from './support/crm.js';

test('US05–US08: oportunidade perdida atualiza o funil e os dados permanecem isolados por cliente', { timeout: 90000 }, async (context) => {
  const { page, apiUrl, frontendUrl } = await startCrm(context);
  // Clientes e interações são pré-condições; as US05–US08 são exercitadas pela interface.
  async function post(path, data) {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    assert.equal(response.status, 201);
    return response.json();
  }
  const alfa = await post('/contacts', { name: 'Cliente Alfa', email: 'alfa@example.com', type: 'client' });
  const beta = await post('/contacts', { name: 'Cliente Beta', email: 'beta@example.com', type: 'client' });
  for (const [client, description] of [[alfa, 'Conversa exclusiva Alfa'], [beta, 'Conversa exclusiva Beta']]) {
    await post(`/contacts/${client.id}/interactions`, {
      type: 'meeting', description, occurred_at: '2026-11-22T12:00:00Z',
    });
  }

  await page.goto(`${frontendUrl}/#/funil`);
  await expect(page.getByText('Modo API', { exact: true })).toBeVisible();
  async function createOpportunity(client, title, value) {
    await page.getByRole('button', { name: 'Nova oportunidade', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Nova oportunidade' });
    await form.getByLabel('Título').fill(title);
    await form.getByLabel('Cliente ou lead').selectOption(String(client.id));
    await form.getByLabel('Valor estimado (R$)').fill(value);
    await form.getByRole('button', { name: 'Criar oportunidade' }).click();
    await expect(form).not.toBeVisible();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await createOpportunity(alfa, 'Projeto Alfa', '1250.50');
  await createOpportunity(beta, 'Projeto Beta', '700');
  const metric = (label) => page.locator('.metric').filter({ has: page.getByText(label, { exact: true }) }).locator('strong');
  await expect(metric('Valor em negociação')).toHaveText(/^R\$\s*1\.950,50$/);
  await expect(metric('Oportunidades abertas')).toHaveText('02');

  // US06: somente a oportunidade de Alfa é encerrada como perdida.
  await page.getByRole('combobox', { name: 'Etapa de Projeto Alfa' }).selectOption('lost');
  const lost = page.getByRole('region', { name: 'Etapa Perdido', exact: true });
  const fresh = page.getByRole('region', { name: 'Etapa Novo', exact: true });
  await expect(lost.getByRole('heading', { name: 'Projeto Alfa' })).toBeVisible();
  await expect(fresh.getByRole('heading', { name: 'Projeto Alfa' })).toHaveCount(0);
  await expect(lost.locator('.stage-total')).toHaveText(/^R\$\s*1\.250,50$/);
  await expect(fresh.locator('.stage-total')).toHaveText(/^R\$\s*700,00$/);
  await expect(metric('Valor em negociação')).toHaveText(/^R\$\s*700,00$/);
  await expect(metric('Oportunidades abertas')).toHaveText('01');
  await expect(metric('Valor conquistado')).toHaveText(/^R\$\s*0,00$/);

  // US07: filtros e busca mudam os cartões, sem alterar os indicadores gerais.
  await page.getByRole('button', { name: 'Abertas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projeto Alfa' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Projeto Beta' })).toBeVisible();
  await page.getByRole('button', { name: 'Encerradas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projeto Alfa' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Projeto Beta' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar oportunidades' }).fill('Cliente Beta');
  await expect(page.getByRole('heading', { name: 'Projeto Beta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Projeto Alfa' })).toHaveCount(0);
  await expect(metric('Valor em negociação')).toHaveText(/^R\$\s*700,00$/);
  await page.getByRole('button', { name: 'Limpar busca' }).click();

  // US08: conferir ambos os clientes antes e depois de recarregar evita falso positivo.
  for (const [client, own, other, value] of [[alfa, 'Alfa', 'Beta', /^R\$\s*0,00$/], [beta, 'Beta', 'Alfa', /^R\$\s*700,00$/]]) {
    await page.getByRole('combobox', { name: 'Visão do cliente', exact: true }).selectOption(String(client.id));
    for (const reload of [false, true]) {
      if (reload) await page.reload();
      await expect(page.getByRole('heading', { name: client.name, exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: `Projeto ${own}`, exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: `Projeto ${other}`, exact: true })).toHaveCount(0);
      await expect(page.getByText(`Conversa exclusiva ${own}`, { exact: true })).toBeVisible();
      await expect(page.getByText(`Conversa exclusiva ${other}`, { exact: true })).toHaveCount(0);
      await expect(page.locator('.client-summary strong')).toHaveText(value);
      await expect(page.getByRole('combobox', { name: `Etapa de Projeto ${own}` })).toHaveValue(own === 'Alfa' ? 'lost' : 'new');
    }
  }
  const response = await fetch(`${apiUrl}/opportunities`);
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.length, 2);
  assert.deepEqual(saved.map(({ title, client_id, stage, value }) => ({ title, client_id, stage, value: Number(value) }))
    .sort((a, b) => a.title.localeCompare(b.title)), [
    { title: 'Projeto Alfa', client_id: alfa.id, stage: 'lost', value: 1250.5 },
    { title: 'Projeto Beta', client_id: beta.id, stage: 'new', value: 700 },
  ]);
});
