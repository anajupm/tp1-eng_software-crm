export const STAGES = [
  { id: 'new', label: 'Novo', color: 'slate' },
  { id: 'contact', label: 'Em contato', color: 'blue' },
  { id: 'proposal', label: 'Proposta', color: 'amber' },
  { id: 'won', label: 'Ganho', color: 'green' },
  { id: 'lost', label: 'Perdido', color: 'rose' },
];

export const isOpen = (opportunity) => !['won', 'lost'].includes(opportunity.stage);
export const money = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 2,
}).format(value);
export const dateLabel = (value) => value
  ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value.slice(0, 10)}T12:00:00`))
  : 'Sem previsão';
export const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2)
  .map((part) => part[0]).join('').toUpperCase();

export function validateOpportunity(draft, clients) {
  const errors = {};
  if (!draft.title?.trim()) errors.title = 'Informe um título para a oportunidade.';
  else if (draft.title.trim().length > 120) errors.title = 'Use até 120 caracteres.';
  if (!clients.some((client) => String(client.id) === String(draft.client_id))) {
    errors.client_id = 'Selecione um cliente cadastrado.';
  }
  if (String(draft.value ?? '').trim() === '' || !Number.isFinite(Number(draft.value))
    || Number(draft.value) < 0 || Number(draft.value) > 999999999.99) {
    errors.value = 'Informe um valor entre R$ 0,00 e R$ 999.999.999,99.';
  } else if (Math.abs(Number(draft.value) * 100 - Math.round(Number(draft.value) * 100)) > 0.0001) {
    errors.value = 'Use no máximo duas casas decimais.';
  }
  if (!STAGES.some((stage) => stage.id === draft.stage)) errors.stage = 'Selecione uma etapa válida.';
  if (draft.expected_close_date && (!/^\d{4}-\d{2}-\d{2}$/.test(draft.expected_close_date)
    || !Number.isFinite(Date.parse(draft.expected_close_date))
    || new Date(draft.expected_close_date).toISOString().slice(0, 10) !== draft.expected_close_date)) {
    errors.expected_close_date = 'Informe uma data válida.';
  }
  if ((draft.notes ?? '').length > 2000) errors.notes = 'Use até 2.000 caracteres.';
  return errors;
}

export function prepareOpportunity(draft, clients) {
  const errors = validateOpportunity(draft, clients);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return {
    title: draft.title.trim(),
    client_id: clients.find((client) => String(client.id) === String(draft.client_id)).id,
    value: Number(draft.value), stage: draft.stage,
    expected_close_date: draft.expected_close_date || null,
    notes: (draft.notes ?? '').trim(),
  };
}
