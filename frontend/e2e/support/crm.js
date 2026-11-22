import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryDir = resolve(frontendDir, '..');

async function freePort() {
  const server = createServer();
  await new Promise((ready, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', ready); });
  const { port } = server.address();
  await new Promise((closed) => server.close(closed));
  return port;
}

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  let failure;
  child.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.stderr.on('data', (chunk) => { output = `${output}${chunk}`.slice(-4000); });
  child.on('error', (error) => { failure = error; });
  return { child, output: () => output, failure: () => failure };
}

async function waitForServer(url, processInfo) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (processInfo.failure()) throw processInfo.failure();
    if (processInfo.child.exitCode !== null) break;
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch { /* Aguarda a inicialização, sem um tempo fixo de startup. */ }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`Serviço indisponível em ${url}: ${processInfo.output()}`);
}

async function stop(info) {
  if (!info?.child.pid || info.child.exitCode !== null || info.child.signalCode !== null) return;
  const closed = new Promise((done) => info.child.once('close', done));
  const timeout = setTimeout(() => info.child.kill('SIGKILL'), 3000);
  try { info.child.kill('SIGTERM'); await closed; }
  finally { clearTimeout(timeout); }
}

export async function startCrm(context) {
  const databaseDir = await mkdtemp(join(tmpdir(), 'nexocrm-leonardo-'));
  let api;
  let frontend;
  let browser;
  context.after(async () => {
    try { await browser?.close(); }
    finally {
      await Promise.all([stop(frontend), stop(api)]);
      // Somente o diretório temporário exclusivo criado acima é removido.
      await rm(databaseDir, { recursive: true, force: true, maxRetries: 3 });
    }
  });
  const port = await freePort();
  const apiUrl = `http://127.0.0.1:${port}`;
  const frontendUrl = 'http://127.0.0.1:5173'; // Origem permitida pelo CORS do projeto.
  api = start(process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), [
    '-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(port),
  ], { cwd: databaseDir, env: { ...process.env, PYTHONPATH: repositoryDir } });
  frontend = start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: frontendDir, env: { ...process.env, VITE_DATA_SOURCE: 'api', VITE_API_URL: apiUrl },
  });
  await Promise.all([waitForServer(`${apiUrl}/openapi.json`, api), waitForServer(frontendUrl, frontend)]);
  browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  return { page, apiUrl, frontendUrl };
}
