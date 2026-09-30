// Dados inteiramente fictícios, usados somente no modo de demonstração.
export const clients = [
  { id: 1, name: 'Marina Costa', company: 'Aurora Studio', type: 'client', email: 'marina@example.com', phone: '(31) 99999-0101' },
  { id: 2, name: 'Rafael Mendes', company: 'Verde Café', type: 'lead', email: 'rafael@example.com', phone: '(31) 99999-0102' },
  { id: 3, name: 'Camila Rocha', company: 'Órbita Digital', type: 'client', email: 'camila@example.com', phone: '(31) 99999-0103' },
  { id: 4, name: 'Pedro Almeida', company: 'Casa Norte', type: 'lead', email: 'pedro@example.com', phone: '(31) 99999-0104' },
  { id: 5, name: 'Luiza Santos', company: 'Forma Arquitetura', type: 'client', email: 'luiza@example.com', phone: '(31) 99999-0105' },
];

export const opportunities = [
  { id: 'demo-1', client_id: 2, title: 'Expansão da operação', value: 4800, stage: 'new', expected_close_date: '2026-10-15', notes: 'Entender as necessidades da nova unidade.', created_at: '2026-09-24T13:00:00Z' },
  { id: 'demo-2', client_id: 4, title: 'Pacote de consultoria', value: 3200, stage: 'new', expected_close_date: '2026-10-20', notes: '', created_at: '2026-09-25T13:00:00Z' },
  { id: 'demo-3', client_id: 1, title: 'Plano de crescimento', value: 8500, stage: 'contact', expected_close_date: '2026-10-08', notes: 'Apresentar opções de acompanhamento mensal.', created_at: '2026-09-20T13:00:00Z' },
  { id: 'demo-4', client_id: 3, title: 'Renovação anual', value: 12000, stage: 'proposal', expected_close_date: '2026-10-02', notes: 'Proposta enviada para análise.', created_at: '2026-09-19T13:00:00Z' },
  { id: 'demo-5', client_id: 5, title: 'Projeto de implantação', value: 6400, stage: 'proposal', expected_close_date: null, notes: '', created_at: '2026-09-22T13:00:00Z' },
  { id: 'demo-6', client_id: 1, title: 'Diagnóstico comercial', value: 2500, stage: 'won', expected_close_date: '2026-09-23', notes: 'Cliente aprovou o diagnóstico inicial.', created_at: '2026-09-16T13:00:00Z' },
  { id: 'demo-7', client_id: 4, title: 'Treinamento da equipe', value: 1800, stage: 'lost', expected_close_date: null, notes: 'Cliente adiou o investimento.', created_at: '2026-09-15T13:00:00Z' },
];

export const interactions = [
  { id: 1, client_id: 1, type: 'meeting', description: 'Conversamos sobre os objetivos para o próximo trimestre e o plano de crescimento.', occurred_at: '2026-09-25T14:30:00-03:00' },
  { id: 2, client_id: 1, type: 'call', description: 'Marina confirmou o interesse no acompanhamento mensal.', occurred_at: '2026-09-23T10:00:00-03:00' },
  { id: 3, client_id: 1, type: 'email', description: 'Enviamos a apresentação dos serviços e os próximos passos.', occurred_at: '2026-09-21T09:00:00-03:00' },
  { id: 4, client_id: 3, type: 'email', description: 'Proposta de renovação enviada. Aguardando retorno.', occurred_at: '2026-09-24T11:00:00-03:00' },
  { id: 5, client_id: 2, type: 'call', description: 'Primeiro contato para entender a expansão da operação.', occurred_at: '2026-09-24T15:00:00-03:00' },
];
