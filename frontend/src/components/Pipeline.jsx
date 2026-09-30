import { useState } from 'react';
import { ArrowUpRight, CircleDollarSign, Layers3, Plus, Search, Trophy, X } from 'lucide-react';
import { isOpen, money, STAGES } from '../domain/opportunities.js';
import OpportunityCard from './OpportunityCard.jsx';

export default function Pipeline({ data, busy, onStageChange, onCreate }) {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('all');
  const clientMap = new Map(data.clients.map((client) => [String(client.id), client]));
  const open = data.opportunities.filter(isOpen);
  const won = data.opportunities.filter((item) => item.stage === 'won');
  const total = (records) => records.reduce((sum, item) => sum + item.value, 0);
  const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = data.opportunities.filter((item) => {
    const client = clientMap.get(String(item.client_id));
    return normalize(`${item.title} ${client?.name || ''} ${client?.company || ''}`).includes(normalize(search.trim()))
      && (scope === 'all' || (scope === 'open' ? isOpen(item) : !isOpen(item)));
  });
  const stages = STAGES.filter((stage) => scope === 'all' || (scope === 'open'
    ? !['won', 'lost'].includes(stage.id) : ['won', 'lost'].includes(stage.id)));
  return <>
    <header className="page-heading"><div><span className="eyebrow">SEU PRÓXIMO NEGÓCIO, MAIS PERTO</span>
      <h1>Funil de vendas<span className="heading-dot">.</span></h1>
      <p>Acompanhe cada conversa. Transforme oportunidades em relações.</p></div>
      <button className="button primary" onClick={() => onCreate()} disabled={!data.clients.length}><Plus size={18} />Nova oportunidade</button></header>
    <section className="metrics" aria-label="Resumo de todas as oportunidades">
      <article className="metric"><span className="metric-icon"><CircleDollarSign size={21} /></span>
        <div><p>Valor em negociação</p><strong>{money(total(open))}</strong><small>Somatório das oportunidades abertas</small></div></article>
      <article className="metric"><span className="metric-icon blue"><Layers3 size={21} /></span>
        <div><p>Oportunidades abertas</p><strong>{String(open.length).padStart(2, '0')}</strong><small>Negociações em andamento</small></div></article>
      <article className="metric"><span className="metric-icon amber"><Trophy size={21} /></span>
        <div><p>Valor conquistado</p><strong>{money(total(won))}</strong><small>{won.length} {won.length === 1 ? 'oportunidade ganha' : 'oportunidades ganhas'}</small></div></article>
    </section>
    <section className="pipeline-section" aria-labelledby="pipeline-title">
      <div className="section-heading"><div><h2 id="pipeline-title">Suas oportunidades <span className="count">{data.opportunities.length}</span></h2>
        <p>Uma visão clara de cada etapa da negociação.</p></div><span className="subtle-label"><ArrowUpRight size={15} />Do primeiro contato à conquista</span></div>
      <div className="toolbar"><div className="segmented" role="group" aria-label="Filtrar por situação">
        {[['all', 'Todas'], ['open', 'Abertas'], ['closed', 'Encerradas']].map(([id, label]) =>
          <button key={id} aria-pressed={scope === id} className={scope === id ? 'selected' : ''} onClick={() => setScope(id)}>{label}</button>)}</div>
        <div className="search"><Search size={17} /><input aria-label="Buscar oportunidades" value={search}
          onChange={(event) => setSearch(event.target.value)} placeholder="Buscar oportunidade ou cliente" />
          {search && <button className="icon-button" aria-label="Limpar busca" onClick={() => setSearch('')}><X size={15} /></button>}</div></div>
      {!data.clients.length && <p className="notice">Cadastre um cliente no módulo de clientes para criar sua primeira oportunidade.</p>}
      {visible.length === 0 && <p className="notice" role="status">{data.opportunities.length ? 'Nenhuma oportunidade encontrada para esses filtros.' : 'Seu funil está pronto. Crie sua primeira oportunidade.'}</p>}
      <div className="board" style={{ '--columns': stages.length }}>
        {stages.map((stage) => {
          const records = visible.filter((item) => item.stage === stage.id);
          return <section className={`stage-column ${stage.color}`} key={stage.id} aria-label={`Etapa ${stage.label}`}>
            <div className="stage-heading"><span className="stage-dot" /><h3>{stage.label}</h3><span className="stage-count">{records.length}</span>
              <button className="icon-button" aria-label={`Nova oportunidade em ${stage.label}`} disabled={!data.clients.length} onClick={() => onCreate(stage.id)}><Plus size={15} /></button></div>
            <p className="stage-total">{money(total(records))}</p>
            <div className="stage-cards">{records.map((item) => <OpportunityCard key={item.id} opportunity={item}
              client={clientMap.get(String(item.client_id))} busy={busy.has(item.id)} onStageChange={onStageChange} />)}
              {!records.length && <div className="empty-stage"><Layers3 size={22} /><p>Nenhuma oportunidade<br />nesta etapa</p></div>}</div>
          </section>;
        })}
      </div>
      <p className="board-caption">Use o seletor de cada cartão para atualizar a etapa da oportunidade.</p>
    </section>
  </>;
}
