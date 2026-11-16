import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

function findCreateButton(node) {
  if (node == null || typeof node !== 'object') return null;
  if (Array.isArray(node)) return node.map(findCreateButton).find(Boolean) || null;
  if (node.type === 'button' && node.props.className === 'button primary') return node;
  return findCreateButton(node.props?.children);
}

test('visão do cliente reúne seus dados em ordem e cria oportunidade para ele', async () => {
  const vite = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  try {
    const { default: ClientDetail } = await vite.ssrLoadModule('/src/components/ClientDetail.jsx');
    const data = {
      clients: [
        { id: 1, name: 'Ana Silva', company: 'Órbita', email: 'ana@example.com', phone: '123', type: 'client' },
        { id: 2, name: 'Bruno Costa', company: 'Nexo', email: 'bruno@example.com', phone: '456', type: 'lead' },
      ],
      opportunities: [
        { id: 10, client_id: 1, title: 'Consultoria', value: 100, stage: 'new', expected_close_date: null },
        { id: 11, client_id: 2, title: 'Negócio de Bruno', value: 500, stage: 'won', expected_close_date: null },
      ],
      interactions: [
        { id: 1, client_id: 1, type: 'call', description: 'Contato antigo', occurred_at: '2026-09-01T10:00:00Z' },
        { id: 2, client_id: 2, type: 'email', description: 'Contato de Bruno', occurred_at: '2026-09-03T10:00:00Z' },
        { id: 3, client_id: 1, type: 'meeting', description: 'Contato recente', occurred_at: '2026-09-02T10:00:00Z' },
      ],
    };
    const calls = [];
    const view = ClientDetail({
      data, clientId: '1', busy: new Set(), onStageChange: () => {},
      onCreate: (...args) => calls.push(args),
    });
    const html = renderToStaticMarkup(view);

    assert.match(html, /Ana Silva/);
    assert.match(html, /ana@example.com/);
    assert.match(html, /Consultoria/);
    assert.doesNotMatch(html, /Negócio de Bruno|Contato de Bruno/);
    assert.ok(html.indexOf('Contato recente') < html.indexOf('Contato antigo'));
    assert.equal(data.interactions[0].description, 'Contato antigo');

    const button = findCreateButton(view);
    assert.ok(button, 'o botão Nova oportunidade deve estar presente');
    button.props.onClick();
    assert.deepEqual(calls, [['new', 1]]);
  } finally {
    await vite.close();
  }
});
