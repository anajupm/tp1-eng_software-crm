import { ArrowLeft, Building2, Mail, Phone, Plus, MessageSquare, CalendarDays } from 'lucide-react';
import { initials, isOpen, money } from '../domain/opportunities.js';
import OpportunityCard from './OpportunityCard.jsx';

export default function ClientDetail({ data, clientId, busy, onStageChange, onCreate, onEditClient, onLogInteraction }) {
  const client = data.clients.find((item) => String(item.id) === String(clientId));
  if (!client) return <section className="empty-page"><h1>Cliente não encontrado</h1>
    <p>Selecione um cliente disponível no menu ou volte ao funil.</p><a className="button secondary" href="#/funil">Voltar ao funil</a></section>;
  const opportunities = data.opportunities.filter((item) => String(item.client_id) === String(client.id));
  const interactions = data.interactions.filter((item) => String(item.client_id) === String(client.id))
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
  const interactionTypes = { call: 'Ligação', meeting: 'Reunião', email: 'E-mail', other: 'Contato' };
  const openValue = opportunities.filter(isOpen).reduce((sum, item) => sum + item.value, 0);
  return <>
    <div style={{ display: 'flex', gap: '15px' }}>
      <a className="back-link" href="#/clientes"><ArrowLeft size={16} />Lista de clientes</a>
      <a className="back-link" href="#/funil"><ArrowLeft size={16} />Funil de vendas</a>
    </div>
    <header className="page-heading"><div><span className="eyebrow">CADA CONTATO TEM UMA HISTÓRIA</span><h1>Visão do cliente<span className="heading-dot">.</span></h1>
      <p>Informações, conversas e negócios. Tudo conectado.</p></div>
      <button className="button primary" onClick={() => onCreate('new', client.id)}><Plus size={18} />Nova oportunidade</button></header>
    <section className="client-profile" aria-labelledby="client-name"><div className="client-avatar">{initials(client.name)}</div>
      <div className="client-identity"><span className="client-type">{client.type === 'lead' ? 'Lead' : 'Cliente'}</span>
        <h2 id="client-name">{client.name}</h2><p><Building2 size={15} />{client.company || 'Empresa não informada'}</p></div>
      <div className="client-contact"><p><Mail size={16} />{client.email || 'E-mail não informado'}</p><p><Phone size={16} />{client.phone || 'Telefone não informado'}</p>
        <div className="client-profile-actions">
          <button className="button secondary small" onClick={() => onEditClient?.(client)}>Editar dados</button>
          <button className="button secondary small" onClick={() => onLogInteraction?.(client)}><MessageSquare size={14} />Registrar contato</button>
        </div>
      </div>
      <div className="client-summary"><span>Em negociação</span><strong>{money(openValue)}</strong><small>{opportunities.length} {opportunities.length === 1 ? 'oportunidade' : 'oportunidades'} no total</small></div>
    </section>
    <div className="client-layout"><section className="client-opportunities" aria-labelledby="client-opportunities-title">
      <div className="section-heading"><div><h2 id="client-opportunities-title">Oportunidades <span className="count">{opportunities.length}</span></h2><p>Os negócios que fazem parte dessa relação.</p></div></div>
      <div className="client-card-grid">{opportunities.map((item) => <OpportunityCard key={item.id} opportunity={item} client={client}
        busy={busy.has(item.id)} onStageChange={onStageChange} />)}</div>
      {!opportunities.length && <div className="empty-state"><Building2 size={28} /><h3>A próxima oportunidade começa aqui</h3><p>Este cliente ainda não possui oportunidades.</p>
        <button className="button secondary" onClick={() => onCreate('new', client.id)}>Criar oportunidade</button></div>}
    </section>
      <section className="timeline-panel" aria-labelledby="history-title"><div className="section-heading"><div><h2 id="history-title">Histórico de interações</h2><p>Conversas que aproximam.</p></div>
        <button className="button secondary small" onClick={() => onLogInteraction?.(client)}><Plus size={14} />Novo contato</button></div>
        {interactions.length ? <ol className="timeline">{interactions.map((item) => <li key={item.id}><span className="timeline-dot" />
          <div className="timeline-meta"><strong>{interactionTypes[item.type] || 'Contato'}</strong>
            <time dateTime={item.occurred_at}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.occurred_at))}</time></div>
          <p>{item.description}</p></li>)}</ol> : <div className="empty-state"><CalendarDays size={28} /><h3>Ainda sem interações</h3><p>Os contatos registrados com este cliente aparecerão aqui.</p>
          <button className="button secondary" onClick={() => onLogInteraction?.(client)}>Registrar primeiro contato</button></div>}
      </section></div>
  </>;
}
