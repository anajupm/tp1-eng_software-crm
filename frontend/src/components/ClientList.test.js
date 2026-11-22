import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('ClientList exibe contadores por tipo e métricas comerciais de cada cliente', async () => {
  const vite = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const { default: ClientList } = await vite.ssrLoadModule('/src/components/ClientList.jsx');
    const data = {
      clients: [
        {
          id: 1,
          name: 'Ana Silva',
          company: 'Órbita Tech',
          email: 'ana@orbita.com',
          phone: '(31) 99999-1111',
          type: 'client',
        },
        {
          id: 2,
          name: 'Bruno Costa',
          company: '',
          email: 'bruno@lead.com',
          phone: '',
          type: 'lead',
        },
      ],
      opportunities: [
        { id: 10, client_id: 1, title: 'Consultoria', value: 1500, stage: 'proposal' },
        { id: 11, client_id: 1, title: 'Implantação', value: 500, stage: 'new' },
        { id: 12, client_id: 1, title: 'Contrato fechado', value: 9000, stage: 'won' },
      ],
      interactions: [
        { id: 100, client_id: 1, type: 'call', description: 'Ligação inicial', occurred_at: '2026-10-01T10:00:00Z' },
        { id: 101, client_id: 1, type: 'meeting', description: 'Reunião de alinhamento', occurred_at: '2026-10-02T14:00:00Z' },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(ClientList, {
        data,
        onNewClient: () => {},
        onEditClient: () => {},
        onLogInteraction: () => {},
        onCreateOpportunity: () => {},
      })
    );

    assert.match(html, /Todos \(2\)/);
    assert.match(html, /Clientes \(1\)/);
    assert.match(html, /Leads \(1\)/);

    assert.match(html, /Ana Silva/);
    assert.match(html, /Órbita Tech/);
    assert.match(html, /ana@orbita\.com/);
    assert.match(html, /2\.000,00/); // soma apenas oportunidades abertas (1500 + 500)
    assert.match(html, /<span>Oportunidades<\/span><strong>3<\/strong>/);
    assert.match(html, /<span>Contatos<\/span><strong>2<\/strong>/);

    assert.match(html, /Bruno Costa/);
    assert.match(html, /Empresa não informada/);
    assert.match(html, /#\/clientes\/1/);
    assert.match(html, /#\/clientes\/2/);
  } finally {
    await vite.close();
  }
});

test('ClientList exibe estado vazio quando não há clientes cadastrados', async () => {
  const vite = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  try {
    const { default: ClientList } = await vite.ssrLoadModule('/src/components/ClientList.jsx');
    const html = renderToStaticMarkup(
      createElement(ClientList, {
        data: { clients: [], opportunities: [], interactions: [] },
        onNewClient: () => {},
        onEditClient: () => {},
        onLogInteraction: () => {},
        onCreateOpportunity: () => {},
      })
    );

    assert.match(html, /Nenhum cliente cadastrado/);
    assert.match(html, /Cadastrar cliente/);
  } finally {
    await vite.close();
  }
});
