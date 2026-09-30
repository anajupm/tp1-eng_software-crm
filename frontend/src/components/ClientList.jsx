import { useMemo, useState } from 'react';
import { Building2, ChevronRight, Mail, MessageSquare, Phone, Plus, Search, Users, X } from 'lucide-react';
import { initials, isOpen, money } from '../domain/opportunities.js';
import { searchClients } from '../domain/clients.js';

export default function ClientList({ data, onNewClient, onEditClient, onLogInteraction, onCreateOpportunity }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = searchClients(data.clients, query);
    if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter);
    return list;
  }, [data.clients, query, typeFilter]);

  const countLead = data.clients.filter((c) => c.type === 'lead').length;
  const countClient = data.clients.filter((c) => c.type === 'client').length;

  return <>
    <header className="page-heading">
      <div>
        <span className="eyebrow">DIRETÓRIO COMERCIAL</span>
        <h1>Clientes e Leads<span className="heading-dot">.</span></h1>
        <p>Gerencie contatos, filtre por tipo e acompanhe o histórico de cada cliente.</p>
      </div>
      <button className="button primary" onClick={onNewClient}><Plus size={18} />Novo cliente</button>
    </header>
    <div className="client-list-toolbar">
      <div className="search-bar">
        <Search size={18} />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por nome, empresa, e-mail ou telefone…" />
        {query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Limpar"><X size={16} /></button>}
      </div>
      <div className="filter-group" role="tablist">
        <button className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Todos ({data.clients.length})</button>
        <button className={`filter-chip ${typeFilter === 'client' ? 'active' : ''}`} onClick={() => setTypeFilter('client')}>Clientes ({countClient})</button>
        <button className={`filter-chip ${typeFilter === 'lead' ? 'active' : ''}`} onClick={() => setTypeFilter('lead')}>Leads ({countLead})</button>
      </div>
    </div>
    {filtered.length ? (
      <div className="client-grid">
        {filtered.map((client) => {
          const clientOpps = data.opportunities.filter((o) => String(o.client_id) === String(client.id));
          const openSum = clientOpps.filter(isOpen).reduce((sum, o) => sum + o.value, 0);
          const clientInteractions = data.interactions.filter((i) => String(i.client_id) === String(client.id));
          return (
            <article key={client.id} className="client-card" aria-labelledby={`client-${client.id}-title`}>
              <div className="client-card-top">
                <div className="client-card-avatar">{initials(client.name)}</div>
                <div className="client-card-info">
                  <span className={`client-type-tag ${client.type}`}>{client.type === 'lead' ? 'Lead' : 'Cliente'}</span>
                  <h2 id={`client-${client.id}-title`}>
                    <a href={`#/clientes/${encodeURIComponent(client.id)}`}>{client.name}</a>
                  </h2>
                  <p className="client-card-company"><Building2 size={14} />{client.company || 'Empresa não informada'}</p>
                </div>
              </div>
              <div className="client-card-contacts">
                <span title="E-mail"><Mail size={14} />{client.email}</span>
                {client.phone && <span title="Telefone"><Phone size={14} />{client.phone}</span>}
              </div>
              <div className="client-card-metrics">
                <div><span>Negociação</span><strong>{money(openSum)}</strong></div>
                <div><span>Oportunidades</span><strong>{clientOpps.length}</strong></div>
                <div><span>Contatos</span><strong>{clientInteractions.length}</strong></div>
              </div>
              <div className="client-card-actions">
                <button className="button secondary small" onClick={() => onLogInteraction(client)} title="Registrar contato">
                  <MessageSquare size={14} />Contato
                </button>
                <button className="button secondary small" onClick={() => onEditClient(client)} title="Editar dados">Editar</button>
                <a className="button primary small" href={`#/clientes/${encodeURIComponent(client.id)}`}>Detalhes <ChevronRight size={14} /></a>
              </div>
            </article>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">
        <Users size={32} />
        <h3>{query ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'}</h3>
        <p>{query ? 'Tente buscar com outros termos ou limpe o campo de pesquisa.' : 'Comece cadastrando seu primeiro lead ou cliente para gerenciar oportunidades.'}</p>
        {query ? <button className="button secondary" onClick={() => setQuery('')}>Limpar busca</button> : <button className="button primary" onClick={onNewClient}><Plus size={16} />Cadastrar cliente</button>}
      </div>
    )}
  </>;
}
