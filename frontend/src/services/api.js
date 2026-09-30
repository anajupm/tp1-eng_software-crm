export function createApiService(baseUrl) {
  async function request(path, options = {}) {
    let response;

    try {
      response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
      );
    }

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error(
          'O servidor recusou os dados. Confira os campos e o contrato da API.'
        );
      }

      if (response.status === 404) {
        throw new Error('Registro ou endpoint não encontrado no servidor.');
      }

      if (response.status === 409) {
        throw new Error('Já existe um cliente cadastrado com este e-mail.');
      }

      throw new Error(
        `Não foi possível concluir a operação (HTTP ${response.status}). Tente novamente.`
      );
    }

    return response.json();
  }

  function adaptInteraction(interaction) {
    return {
      ...interaction,
      client_id: interaction.contact_id,
    };
  }

  return {
    async load() {
      const clients = await request('/contacts');

      if (!Array.isArray(clients)) {
        throw new Error(
          'Resposta inesperada do servidor: a consulta de contatos deve retornar uma lista.'
        );
      }

      const interactionLists = await Promise.all(
        clients.map((client) =>
          request(`/contacts/${encodeURIComponent(client.id)}/interactions`)
        )
      );

      const interactions = interactionLists
        .flat()
        .map(adaptInteraction);

      return {
        clients,
        interactions,
        opportunities: [],
      };
    },

    createClient: (draft) =>
      request('/contacts', {
        method: 'POST',
        body: JSON.stringify(draft),
      }),

    updateClient: (id, draft) =>
      request(`/contacts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(draft),
      }),

    async createInteraction(draft) {
      const { client_id, ...interactionData } = draft;

      const created = await request(
        `/contacts/${encodeURIComponent(client_id)}/interactions`,
        {
          method: 'POST',
          body: JSON.stringify(interactionData),
        }
      );

      return adaptInteraction(created);
    },

    createOpportunity: (draft) =>
      request('/opportunities', {
        method: 'POST',
        body: JSON.stringify(draft),
      }),

    changeStage: (id, stage) =>
      request(`/opportunities/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      }),
  };
}