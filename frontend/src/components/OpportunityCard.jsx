import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { dateLabel, money, STAGES, initials } from '../domain/opportunities.js';

export default function OpportunityCard({ opportunity, client, busy, onStageChange }) {
  return <article className="opportunity-card">
    <div className="card-company"><span className="mini-avatar">{initials(client?.company || client?.name || '?')}</span>
      <span>{client?.company || client?.name || 'Cliente indisponível'}</span></div>
    <h3>{opportunity.title}</h3>
    <p className="card-value">{money(opportunity.value)}</p>
    {opportunity.notes && <p className="card-note" title={opportunity.notes}>{opportunity.notes}</p>}
    <div className="card-date"><CalendarDays size={13} aria-hidden="true" />{dateLabel(opportunity.expected_close_date)}</div>
    <div className="card-footer">
      <label className="sr-only" htmlFor={`stage-${opportunity.id}`}>Etapa de {opportunity.title}</label>
      <select id={`stage-${opportunity.id}`} value={opportunity.stage} disabled={busy}
        onChange={(event) => onStageChange(opportunity.id, event.target.value)}>
        {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
      </select>
      {client && <a className="icon-button" href={`#/clientes/${encodeURIComponent(client.id)}`}
        aria-label={`Ver cliente ${client.name}`} title={`Ver ${client.name}`}><ArrowUpRight size={17} /></a>}
    </div>
  </article>;
}
