import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ChevronRight, GitBranch, LayoutDashboard, RefreshCw, Users, X } from 'lucide-react';
import { crm, dataSource } from './services/index.js';
import Pipeline from './components/Pipeline.jsx';
import ClientDetail from './components/ClientDetail.jsx';
import ClientList from './components/ClientList.jsx';
import ClientForm from './components/ClientForm.jsx';
import InteractionForm from './components/InteractionForm.jsx';
import OpportunityForm from './components/OpportunityForm.jsx';

function readRoute() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/clientes\/([^/]+)$/);
  if (match) {
    try { return { page: 'client', id: decodeURIComponent(match[1]) }; }
    catch { return { page: 'client', id: '' }; }
  }
  if (hash === '#/clientes') return { page: 'client-list' };
  return { page: 'pipeline' };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
  const [clientModal, setClientModal] = useState(null);
  const [interactionModal, setInteractionModal] = useState(null);
  const [busy, setBusy] = useState(new Set());
  const pending = useRef(new Set());
  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setData(await crm.load()); }
    catch (error) { setLoadError(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const navigate = () => { setRoute(readRoute()); setActionError(''); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    const title = route.page === 'client' ? 'Visão do cliente' : route.page === 'client-list' ? 'Clientes e Leads' : 'Funil de vendas';
    document.title = `NexoCRM | ${title}`;
  }, [route.page]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function changeStage(id, stage) {
    if (pending.current.has(id)) return;
    pending.current.add(id); setBusy(new Set(pending.current)); setActionError('');
    try {
      const updated = await crm.changeStage(id, stage);
      setData((current) => ({ ...current, opportunities: current.opportunities.map((item) => item.id === id ? updated : item) }));
      setNotice('Etapa atualizada com sucesso.');
    } catch (error) { setActionError(error.message); }
    finally { pending.current.delete(id); setBusy(new Set(pending.current)); }
  }
  async function createOpportunity(draft) {
    const created = await crm.createOpportunity(draft);
    setData((current) => ({ ...current, opportunities: [created, ...current.opportunities] }));
    setForm(null); setNotice('Oportunidade criada com sucesso.');
  }
  async function saveClient(draft, id) {
    if (id) {
      const updated = await crm.updateClient(id, draft);
      setData((c) => ({ ...c, clients: c.clients.map((item) => String(item.id) === String(id) ? updated : item) }));
      setNotice('Cliente atualizado com sucesso.');
    } else {
      const created = await crm.createClient(draft);
      setData((c) => ({ ...c, clients: [...c.clients, created] }));
      setNotice('Cliente cadastrado com sucesso.');
    }
    setClientModal(null);
  }
  async function saveInteraction(draft) {
    const created = await crm.createInteraction(draft);
    setData((c) => ({ ...c, interactions: [created, ...c.interactions] }));
    setInteractionModal(null);
    setNotice('Contato registrado com sucesso.');
  }
  const onCreate = (stage = 'new', clientId = '') => setForm({ stage, clientId });
  const pageProps = { data, busy, onStageChange: changeStage, onCreate };
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault(); document.getElementById('main-content').focus();
    }}>Pular para o conteúdo</a>
    <aside className="sidebar"><a className="brand" href="#/funil" aria-label="NexoCRM início"><span className="brand-mark">n</span><span>nexo<span className="brand-light">crm</span></span></a>
      <div className="workspace"><span className="workspace-icon"><GitBranch size={18} /></span><div><strong>Equipe comercial</strong><small>Seu espaço de negócios</small></div></div>
      <span className="nav-label">RELACIONAMENTO</span>
      <nav aria-label="Navegação principal">
        <a href="#/funil" className={route.page === 'pipeline' ? 'active' : ''} aria-current={route.page === 'pipeline' ? 'page' : undefined}><LayoutDashboard size={18} />Funil de vendas<ChevronRight size={15} /></a>
        <a href="#/clientes" className={route.page === 'client-list' ? 'active' : ''} aria-current={route.page === 'client-list' ? 'page' : undefined}><Users size={18} />Clientes e Leads<ChevronRight size={15} /></a>
        <div className={`client-nav ${route.page === 'client' ? 'active' : ''}`}><Users size={18} /><label htmlFor="client-nav">Visão do cliente</label></div>
        <select id="client-nav" className="client-nav-select" disabled={!data?.clients.length} value={route.page === 'client' ? route.id : ''}
          onChange={(event) => { if (event.target.value) window.location.hash = `/clientes/${encodeURIComponent(event.target.value)}`; }}>
          <option value="">Selecione um cliente</option>{data?.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-message"><ArrowUpRight size={22} /><p>Boas relações.<br /><strong>Novos negócios.</strong></p><span>Mais clareza em cada conexão.</span></div>
        <div className="workspace-footer"><span className="footer-dot" />NexoCRM<span>TP1 · 2026</span></div></div>
    </aside>
    <div className="main-shell"><div className="topbar"><span>Workspace <ChevronRight size={13} /><strong>{route.page === 'client' ? 'Visão do cliente' : route.page === 'client-list' ? 'Clientes e Leads' : 'Funil de vendas'}</strong></span>
      <span className={`environment-badge ${dataSource === 'demo' ? 'demo' : ''}`}><span />{dataSource === 'demo' ? 'Demonstração · dados fictícios' : 'Modo API'}</span></div>
      <main id="main-content" tabIndex={-1}>
        {loading ? <div className="empty-page" role="status"><RefreshCw className="spin" /><p>Carregando seu espaço de negócios…</p></div>
          : loadError ? <div className="empty-page"><h1>Não foi possível carregar os dados</h1><p role="alert">{loadError}</p><button className="button primary" onClick={load}><RefreshCw size={16} />Tentar novamente</button></div>
            : <>{actionError && <div className="error-box action-error" role="alert">{actionError}<button className="icon-button" aria-label="Fechar erro" onClick={() => setActionError('')}><X size={18} /></button></div>}
              {route.page === 'client' ? <ClientDetail {...pageProps} clientId={route.id} onEditClient={(c) => setClientModal({ client: c })} onLogInteraction={(c) => setInteractionModal({ client: c })} />
                : route.page === 'client-list' ? <ClientList data={data} onNewClient={() => setClientModal({ client: null })} onEditClient={(c) => setClientModal({ client: c })} onLogInteraction={(c) => setInteractionModal({ client: c })} onCreateOpportunity={onCreate} />
                : <Pipeline {...pageProps} />}</>}
      </main>
      <footer className="page-footer"><span>NexoCRM <span className="footer-separator">/</span> Feito para conectar.</span><span>{dataSource === 'demo' ? 'Alterações salvas neste navegador' : 'Dados do servidor'}</span></footer>
    </div>
    {notice && <div className="toast" role="status"><CheckCircle2 size={19} />{notice}<button className="icon-button" aria-label="Fechar confirmação" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {form && <OpportunityForm clients={data.clients} initialClient={form.clientId} initialStage={form.stage} onSave={createOpportunity} onClose={() => setForm(null)} />}
    {clientModal && <ClientForm initialClient={clientModal.client} existingClients={data.clients} onSave={saveClient} onClose={() => setClientModal(null)} />}
    {interactionModal && <InteractionForm client={interactionModal.client} clients={data.clients} onSave={saveInteraction} onClose={() => setInteractionModal(null)} />}
  </div>;
}
