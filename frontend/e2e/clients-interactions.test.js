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
const pythonCmd = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

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
    } catch {
      // O serviço ainda está iniciando.
    }
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

test('cadastra lead, pesquisa/filtra, edita para cliente, registra interação e valida persistência após recarga', { timeout: 90000 }, async () => {
  const databaseDir = await mkdtemp(join(tmpdir(), 'nexocrm-e2e-clients-'));
  let api;
  let frontend;
  let browser;

  try {
    const apiPort = await freePort();
    const frontendPort = 5173;
    const apiUrl = `http://127.0.0.1:${apiPort}`;
    const frontendUrl = `http://127.0.0.1:${frontendPort}`;

    api = start(
      pythonCmd,
      ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(apiPort)],
      {
        cwd: databaseDir,
        env: { ...process.env, PYTHONPATH: repositoryDir },
      }
    );

    frontend = start(
      process.execPath,
      ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'],
      {
        cwd: frontendDir,
        env: { ...process.env, VITE_DATA_SOURCE: 'api', VITE_API_URL: apiUrl },
      }
    );

    await Promise.all([
      waitForServer(`${apiUrl}/openapi.json`, api),
      waitForServer(frontendUrl, frontend),
    ]);

    try {
      browser = await chromium.launch();
    } catch {
      browser = await chromium.launch({ channel: 'chrome' });
    }
    const page = await browser.newPage();

    const clientName = 'Fernanda Rocha';
    const updatedCompany = 'Rocha Soluções';
    const interactionSummary = 'Reunião de alinhamento técnico e envio da proposta comercial.';

    // US01: Cadastrar um novo lead pela interface
    await page.goto(`${frontendUrl}/#/clientes`);
    await page.getByRole('button', { name: 'Novo cliente' }).click();
    const createDialog = page.getByRole('dialog', { name: 'Novo cliente ou lead' });
    await createDialog.getByLabel('Nome completo').fill(clientName);
    await createDialog.getByLabel('Tipo').selectOption('lead');
    await createDialog.getByLabel('E-mail corporativo').fill('fernanda@rocha.com');
    await createDialog.getByLabel('Empresa').fill('Rocha Consulting');
    await createDialog.getByLabel('Telefone / Celular').fill('(31) 99876-5432');
    await createDialog.getByRole('button', { name: 'Cadastrar cliente' }).click();

    const card = page.locator('.client-card').filter({ hasText: clientName });
    await card.waitFor();
    assert.match(await card.textContent(), /Lead/);

    // US02: Pesquisar cliente e filtrar por tipo
    const searchInput = page.getByPlaceholder('Pesquisar por nome, empresa, e-mail ou telefone…');
    await searchInput.fill('fernanda@rocha.com');
    await card.waitFor();
    await page.getByRole('button', { name: /Leads \(1\)/ }).click();
    await card.waitFor();
    await page.getByRole('button', { name: /Clientes \(0\)/ }).click();
    await page.getByText('Nenhum resultado encontrado').waitFor();
    await page.getByRole('button', { name: /Todos \(1\)/ }).click();
    await searchInput.fill('');
    await card.waitFor();

    // US03: Editar dados do cliente e promover de Lead para Cliente
    await card.getByRole('button', { name: 'Editar' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Atualizar cliente' });
    await editDialog.getByLabel('Tipo').selectOption('client');
    await editDialog.getByLabel('Empresa').fill(updatedCompany);
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click();

    await page.getByRole('button', { name: /Clientes \(1\)/ }).waitFor();
    assert.match(await card.textContent(), new RegExp(updatedCompany));

    // US04: Registrar interação (reunião) com o cliente
    await card.getByRole('button', { name: 'Contato' }).click();
    const interactionDialog = page.getByRole('dialog', { name: 'Registrar contato' });
    await interactionDialog.getByLabel('Tipo de contato').selectOption('meeting');
    await interactionDialog.getByLabel('Anotações e resumo').fill(interactionSummary);
    await interactionDialog.getByRole('button', { name: 'Salvar contato' }).click();

    // Valida atualização na tela de detalhes e persistência após recarregar a página
    await card.getByRole('link', { name: /Detalhes/ }).click();
    await page.getByRole('heading', { name: clientName }).waitFor();
    await page.getByText(updatedCompany).waitFor();
    await page.getByText(interactionSummary).waitFor();

    await page.reload();
    await page.getByRole('heading', { name: clientName }).waitFor();
    await page.getByText(updatedCompany).waitFor();
    await page.getByText(interactionSummary).waitFor();

    // Valida persistência real no backend
    const contacts = await (await fetch(`${apiUrl}/contacts`)).json();
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].name, clientName);
    assert.equal(contacts[0].type, 'client');
    assert.equal(contacts[0].company, updatedCompany);

    const interactions = await (await fetch(`${apiUrl}/contacts/${contacts[0].id}/interactions`)).json();
    assert.equal(interactions.length, 1);
    assert.equal(interactions[0].type, 'meeting');
    assert.equal(interactions[0].description, interactionSummary);
  } finally {
    await browser?.close();
    await Promise.all([stop(frontend), stop(api)]);
    await rm(databaseDir, { recursive: true, force: true });
  }
});
