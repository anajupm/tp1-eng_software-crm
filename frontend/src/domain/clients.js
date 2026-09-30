export const CLIENT_TYPES = [
  { id: 'lead', label: 'Lead' },
  { id: 'client', label: 'Cliente' },
];

export const INTERACTION_TYPES = [
  { id: 'call', label: 'Ligação' },
  { id: 'meeting', label: 'Reunião' },
  { id: 'email', label: 'E-mail' },
  { id: 'other', label: 'Contato' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateClient(draft, existingClients = [], currentId = null) {
  const name = draft?.name?.trim() || '';
  if (!name) return 'O nome do cliente é obrigatório.';
  if (name.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
  const email = draft?.email?.trim() || '';
  if (!email) return 'O e-mail é obrigatório.';
  if (!EMAIL_REGEX.test(email)) return 'Informe um e-mail válido.';
  const emailExists = existingClients.some(
    (c) => c.email?.toLowerCase() === email.toLowerCase() && String(c.id) !== String(currentId)
  );
  if (emailExists) return 'Já existe um cliente cadastrado com este e-mail.';
  if (!CLIENT_TYPES.some((t) => t.id === draft?.type)) return 'Tipo de cliente inválido.';
  if (draft?.company && draft.company.length > 120) return 'A empresa deve ter no máximo 120 caracteres.';
  if (draft?.phone && draft.phone.length > 40) return 'O telefone deve ter no máximo 40 caracteres.';
  return null;
}

export function prepareClient(draft, existingClients = [], currentId = null) {
  const error = validateClient(draft, existingClients, currentId);
  if (error) throw new Error(error);
  return {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    type: draft.type,
    company: draft.company?.trim() || '',
    phone: draft.phone?.trim() || '',
  };
}

export function validateInteraction(draft, clients = []) {
  if (!draft?.client_id || !clients.some((c) => String(c.id) === String(draft.client_id))) {
    return 'Selecione um cliente válido.';
  }
  if (!INTERACTION_TYPES.some((t) => t.id === draft?.type)) return 'Tipo de contato inválido.';
  const description = draft?.description?.trim() || '';
  if (!description) return 'A descrição do contato é obrigatória.';
  if (description.length > 2000) return 'A descrição deve ter no máximo 2.000 caracteres.';
  if (draft?.occurred_at && Number.isNaN(new Date(draft.occurred_at).getTime())) {
    return 'Data de contato inválida.';
  }
  return null;
}

export function prepareInteraction(draft, clients = []) {
  const error = validateInteraction(draft, clients);
  if (error) throw new Error(error);
  return {
    client_id: isNaN(Number(draft.client_id)) ? draft.client_id : Number(draft.client_id),
    type: draft.type,
    description: draft.description.trim(),
    occurred_at: draft.occurred_at ? new Date(draft.occurred_at).toISOString() : new Date().toISOString(),
  };
}

export function searchClients(clients = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return clients;
  return clients.filter((c) =>
    c.name?.toLowerCase().includes(q) ||
    c.company?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q)
  );
}
