import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareClient, prepareInteraction } from '../domain/clients.js';
import { createApiService } from './api.js';

const servicesDir = dirname(fileURLToPath(import.meta.url));
const repositoryDir = resolve(servicesDir, '..', '..', '..');
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

function startBackend(apiPort, databaseDir) {
  const child = spawn(
    pythonCmd,
    ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(apiPort)],
    {
      cwd: databaseDir,
      env: { ...process.env, PYTHONPATH: repositoryDir },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
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
      // Backend ainda iniciando.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  throw new Error(`Backend indisponível em ${url}: ${processInfo.getOutput()}`);
}

async function stopProcess(processInfo) {
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

test('integração frontend/backend: cria, atualiza cliente, bloqueia e-mail duplicado e persiste interação', { timeout: 45000 }, async () => {
  const databaseDir = await mkdtemp(join(tmpdir(), 'nexocrm-int-'));
  let backend;

  try {
    const apiPort = await freePort();
    const apiUrl = `http://127.0.0.1:${apiPort}`;
    backend = startBackend(apiPort, databaseDir);
    await waitForServer(`${apiUrl}/openapi.json`, backend);

    const api = createApiService(apiUrl);

    // 1. Criação de cliente validado pelo domínio e persistido no SQLite via FastAPI
    const draft = prepareClient({
      name: '  Marina Oliveira  ',
      email: '  MARINA@EMPRESA.COM ',
      type: 'lead',
      company: 'Solis Digital',
      phone: '(31) 98888-2222',
    });
    const created = await api.createClient(draft);
    assert.ok(created.id);
    assert.equal(created.name, 'Marina Oliveira');
    assert.equal(created.email, 'marina@empresa.com');
    assert.equal(created.type, 'lead');

    // 2. Regra de integridade no backend: e-mail duplicado retorna HTTP 409 traduzido pelo serviço
    await assert.rejects(
      () => api.createClient({
        name: 'Outro Contato',
        email: 'marina@empresa.com',
        type: 'client',
      }),
      /Já existe um cliente cadastrado com este e-mail/
    );

    // 3. Atualização de dados (US03): promoção de lead para cliente
    const updated = await api.updateClient(created.id, {
      type: 'client',
      company: 'Solis Digital LTDA',
    });
    assert.equal(updated.type, 'client');
    assert.equal(updated.company, 'Solis Digital LTDA');

    // 4. Registro de interação (US04) e adaptação contact_id -> client_id
    const interactionDraft = prepareInteraction(
      {
        client_id: created.id,
        type: 'meeting',
        description: 'Reunião de diagnóstico e apresentação do escopo.',
        occurred_at: '2026-11-22T14:30:00Z',
      },
      [updated]
    );
    const createdInteraction = await api.createInteraction(interactionDraft);
    assert.equal(createdInteraction.client_id, created.id);
    assert.equal(createdInteraction.type, 'meeting');

    // 5. Carga consolidada via load() confirma persistência completa
    const state = await api.load();
    assert.equal(state.clients.length, 1);
    assert.equal(state.clients[0].type, 'client');
    assert.equal(state.clients[0].company, 'Solis Digital LTDA');
    assert.equal(state.interactions.length, 1);
    assert.equal(state.interactions[0].client_id, created.id);
    assert.equal(state.interactions[0].description, 'Reunião de diagnóstico e apresentação do escopo.');
  } finally {
    await stopProcess(backend);
    await rm(databaseDir, { recursive: true, force: true });
  }
});
