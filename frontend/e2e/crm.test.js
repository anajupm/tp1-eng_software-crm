import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = resolve(frontendDir, '..');

async function freePort() {
  const server = createServer();
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });
  const { port } = server.address();
  await new Promise((resolveClosed) => server.close(resolveClosed));
  return port;
}

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.stderr.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.on('error', (error) => { output = `${output}\n${error.message}`; });
  return { child, getOutput: () => output };
}

async function waitForServer(url, processInfo) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (processInfo.child.exitCode !== null) break;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* O serviço ainda está iniciando. */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  throw new Error(`Serviço indisponível em ${url}: ${processInfo.getOutput()}`);
}

async function stop(processInfo) {
  if (!processInfo || processInfo.child.exitCode !== null || processInfo.child.signalCode !== null) return;
  const { child } = processInfo;
  const closed = new Promise((resolveClosed) => child.once('close', resolveClosed));
  const timeout = setTimeout(() => child.kill('SIGKILL'), 3000);
  try {
    child.kill('SIGTERM');
    await closed;
  } finally {
    clearTimeout(timeout);
  }
}

test('cria oportunidade, altera etapa e mantém os dados na visão do cliente após recarga', { timeout: 90000 }, async () => {
  const databaseDir = await mkdtemp(join(tmpdir(), 'nexocrm-e2e-'));
  let api;
  let frontend;
  let browser;
  try {
    const apiPort = await freePort();
    const frontendPort = 5173;
    const apiUrl = `http://127.0.0.1:${apiPort}`;
    const frontendUrl = `http://127.0.0.1:${frontendPort}`;
    api = start(process.env.PYTHON || 'python3', [
      '-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(apiPort),
    ], {
      cwd: databaseDir,
      env: { ...process.env, PYTHONPATH: repositoryDir },
    });
    frontend = start(process.execPath, [
      'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort',
    ], {
      cwd: frontendDir,
      env: { ...process.env, VITE_DATA_SOURCE: 'api', VITE_API_URL: apiUrl },
    });
    await Promise.all([
      waitForServer(`${apiUrl}/openapi.json`, api),
      waitForServer(frontendUrl, frontend),
    ]);

    browser = await chromium.launch();
    const page = await browser.newPage();
    const clientName = 'Cliente E2E';
    const title = 'Consultoria E2E';

    await page.goto(`${frontendUrl}/#/clientes`);
    await page.getByRole('button', { name: 'Novo cliente' }).click();
    const clientForm = page.getByRole('dialog', { name: 'Novo cliente ou lead' });
    await clientForm.getByLabel('Nome completo').fill(clientName);
    await clientForm.getByLabel('Tipo').selectOption('client');
    await clientForm.getByLabel('E-mail corporativo').fill('e2e@example.com');
    await clientForm.getByRole('button', { name: 'Cadastrar cliente' }).click();
    await page.getByRole('link', { name: 'Funil de vendas' }).first().click();

    await page.getByRole('button', { name: 'Nova oportunidade', exact: true }).click();
    const opportunityForm = page.getByRole('dialog', { name: 'Nova oportunidade' });
    await opportunityForm.getByLabel('Título').fill(title);
    await opportunityForm.getByLabel('Cliente ou lead').selectOption({ label: clientName });
    await opportunityForm.getByLabel('Valor estimado (R$)').fill('1250.50');
    await opportunityForm.getByRole('button', { name: 'Criar oportunidade' }).click();

    const newColumn = page.getByRole('region', { name: 'Etapa Novo' });
    const wonColumn = page.getByRole('region', { name: 'Etapa Ganho' });
    const card = newColumn.locator('.opportunity-card').filter({ hasText: title });
    await card.waitFor();
    assert.match(await newColumn.locator('.stage-total').textContent(), /1\.250,50/);
    await card.getByLabel(`Etapa de ${title}`).selectOption('won');
    await wonColumn.getByRole('heading', { name: title }).waitFor();
    assert.equal(await newColumn.getByRole('heading', { name: title }).count(), 0);
    assert.match(await wonColumn.locator('.stage-total').textContent(), /1\.250,50/);
    assert.match(await page.getByText('Valor conquistado').locator('..').locator('strong').textContent(), /1\.250,50/);

    await page.getByRole('button', { name: 'Encerradas' }).click();
    await wonColumn.getByRole('heading', { name: title }).waitFor();
    await wonColumn.getByRole('link', { name: `Ver cliente ${clientName}` }).click();
    await page.getByRole('heading', { name: clientName }).waitFor();
    await page.getByRole('heading', { name: title }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: clientName }).waitFor();
    await page.getByRole('heading', { name: title }).waitFor();

    const saved = await (await fetch(`${apiUrl}/opportunities`)).json();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].title, title);
    assert.equal(saved[0].stage, 'won');
  } finally {
    await browser?.close();
    await Promise.all([stop(frontend), stop(api)]);
    await rm(databaseDir, { recursive: true, force: true });
  }
});
