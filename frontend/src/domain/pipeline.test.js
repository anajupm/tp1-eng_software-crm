import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPipelineView } from './pipeline.js';

test('filtra o funil e calcula totais visíveis sem alterar os indicadores gerais', () => {
  const data = {
    clients: [
      { id: 1, name: 'Ana Silva', company: 'Órbita' },
      { id: 2, name: 'Bruno Costa', company: 'Nexo' },
    ],
    opportunities: [
      { id: 1, client_id: 1, title: 'Consultoria', value: 100, stage: 'new' },
      { id: 2, client_id: 1, title: 'Renovação', value: 200, stage: 'proposal' },
      { id: 3, client_id: 2, title: 'Implantação', value: 300, stage: 'won' },
      { id: 4, client_id: 2, title: 'Treinamento', value: 50, stage: 'lost' },
    ],
  };

  const open = buildPipelineView(data, 'orbita', 'open');
  assert.deepEqual(open.visible.map((item) => item.id), [1, 2]);
  assert.deepEqual(open.columns.map(({ stage, records, value }) => [stage.id, records.length, value]), [
    ['new', 1, 100], ['contact', 0, 0], ['proposal', 1, 200],
  ]);
  assert.deepEqual(open.summary, { openCount: 2, openValue: 300, wonCount: 1, wonValue: 300 });

  const closed = buildPipelineView(data, 'bruno', 'closed');
  assert.deepEqual(closed.visible.map((item) => item.id), [3, 4]);
  assert.deepEqual(closed.columns.map(({ stage, records, value }) => [stage.id, records.length, value]), [
    ['won', 1, 300], ['lost', 1, 50],
  ]);
  assert.deepEqual(closed.summary, open.summary);

  const empty = buildPipelineView(data, 'inexistente');
  assert.equal(empty.visible.length, 0);
  assert.deepEqual(empty.columns.map(({ records, value }) => [records.length, value]), Array(5).fill([0, 0]));
  assert.deepEqual(empty.summary, open.summary);
});
