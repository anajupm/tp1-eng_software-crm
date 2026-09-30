// Contrato PROPOSTO. Ajustar este adaptador quando o backend estiver disponível.
export function createApiService(baseUrl) {
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...options, headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }
    if (!response.ok) {
      if (response.status === 422) throw new Error('O servidor recusou os dados. Confira os campos e o contrato da API.');
      if (response.status === 404) throw new Error('Registro ou endpoint não encontrado no servidor.');
      throw new Error(`Não foi possível concluir a operação (HTTP ${response.status}). Tente novamente.`);
    }
    return response.json();
  }
  return {
    async load() {
      const [clients, opportunities, interactions] = await Promise.all([
        request('/clients'), request('/opportunities'), request('/interactions'),
      ]);
      if (![clients, opportunities, interactions].every(Array.isArray)) {
        throw new Error('Resposta inesperada do servidor: as consultas devem retornar listas.');
      }
      return { clients, opportunities, interactions };
    },
    createClient: (draft) => request('/clients', { method: 'POST', body: JSON.stringify(draft) }),
    updateClient: (id, draft) => request(`/clients/${encodeURIComponent(id)}`, {
      method: 'PUT', body: JSON.stringify(draft),
    }),
    createInteraction: (draft) => request('/interactions', { method: 'POST', body: JSON.stringify(draft) }),
    createOpportunity: (draft) => request('/opportunities', { method: 'POST', body: JSON.stringify(draft) }),
    changeStage: (id, stage) => request(`/opportunities/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({ stage }),
    }),
  };
}
