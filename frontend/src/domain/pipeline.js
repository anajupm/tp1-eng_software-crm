import { isOpen, STAGES } from './opportunities.js';

const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const total = (records) => records.reduce((sum, item) => sum + item.value, 0);

export function buildPipelineView(data, search = '', scope = 'all') {
  const clientMap = new Map(data.clients.map((client) => [String(client.id), client]));
  const open = data.opportunities.filter(isOpen);
  const won = data.opportunities.filter((item) => item.stage === 'won');
  const query = normalize(search.trim());
  const visible = data.opportunities.filter((item) => {
    const client = clientMap.get(String(item.client_id));
    return normalize(`${item.title} ${client?.name || ''} ${client?.company || ''}`).includes(query)
      && (scope === 'all' || (scope === 'open' ? isOpen(item) : !isOpen(item)));
  });
  const stages = STAGES.filter((stage) => scope === 'all' || (scope === 'open'
    ? !['won', 'lost'].includes(stage.id) : ['won', 'lost'].includes(stage.id)));

  return {
    clientMap,
    summary: { openCount: open.length, openValue: total(open), wonCount: won.length, wonValue: total(won) },
    visible,
    columns: stages.map((stage) => {
      const records = visible.filter((item) => item.stage === stage.id);
      return { stage, records, value: total(records) };
    }),
  };
}
