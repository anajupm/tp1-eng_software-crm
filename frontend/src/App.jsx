import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ChevronRight, GitBranch, LayoutDashboard, RefreshCw, Users, X } from 'lucide-react';
import { crm, dataSource } from './services/index.js';
import Pipeline from './components/Pipeline.jsx';
import ClientDetail from './components/ClientDetail.jsx';
import OpportunityForm from './components/OpportunityForm.jsx';

function readRoute() {
  const match = window.location.hash.match(/^#\/clientes\/([^/]+)$/);
  if (!match) return { page: 'pipeline' };
  try { return { page: 'client', id: decodeURIComponent(match[1]) }; }
  catch { return { page: 'client', id: '' }; }
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(null);
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
    document.title = `NexoCRM | ${route.page === 'client' ? 'Visão do cliente' : 'Funil de vendas'}`;
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
  const onCreate = (stage = 'new', clientId = '') => setForm({ stage, clientId });
  const pageProps = { data, busy, onStageChange: changeStage, onCreate };
  return <div className="app-shell">
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault(); document.getElementById('main-content').focus();
    }}>Pular para o conteúdo</a>
    <aside className="sidebar"><a className="brand" href="#/funil" aria-label="NexoCRM início"><span className="brand-mark">n</span><span>nexo<span className="brand-light">crm</span></span></a>
      <div className="workspace"><span className="workspace-icon"><GitBranch size={18} /></span><div><strong>Equipe comercial</strong><small>Seu espaço de negócios</small></div></div>
      <span className="nav-label">RELACIONAMENTO</span>
      <nav aria-label="Navegação principal"><a href="#/funil" className={route.page === 'pipeline' ? 'active' : ''} aria-current={route.page === 'pipeline' ? 'page' : undefined}><LayoutDashboard size={18} />Funil de vendas<ChevronRight size={15} /></a>
        <div className={`client-nav ${route.page === 'client' ? 'active' : ''}`}><Users size={18} /><label htmlFor="client-nav">Visão do cliente</label></div>
        <select id="client-nav" className="client-nav-select" disabled={!data?.clients.length} value={route.page === 'client' ? route.id : ''}
          onChange={(event) => { if (event.target.value) window.location.hash = `/clientes/${encodeURIComponent(event.target.value)}`; }}>
          <option value="">Selecione um cliente</option>{data?.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-message"><ArrowUpRight size={22} /><p>Boas relações.<br /><strong>Novos negócios.</strong></p><span>Mais clareza em cada conexão.</span></div>
        <div className="workspace-footer"><span className="footer-dot" />NexoCRM<span>TP1 · 2026</span></div></div>
    </aside>
    <div className="main-shell"><div className="topbar"><span>Workspace <ChevronRight size={13} /><strong>{route.page === 'client' ? 'Visão do cliente' : 'Funil de vendas'}</strong></span>
      <span className={`environment-badge ${dataSource === 'demo' ? 'demo' : ''}`}><span />{dataSource === 'demo' ? 'Demonstração · dados fictícios' : 'Modo API'}</span></div>
      <main id="main-content" tabIndex={-1}>
        {loading ? <div className="empty-page" role="status"><RefreshCw className="spin" /><p>Carregando seu espaço de negócios…</p></div>
          : loadError ? <div className="empty-page"><h1>Não foi possível carregar os dados</h1><p role="alert">{loadError}</p><button className="button primary" onClick={load}><RefreshCw size={16} />Tentar novamente</button></div>
            : <>{actionError && <div className="error-box action-error" role="alert">{actionError}<button className="icon-button" aria-label="Fechar erro" onClick={() => setActionError('')}><X size={18} /></button></div>}
              {route.page === 'client' ? <ClientDetail {...pageProps} clientId={route.id} /> : <Pipeline {...pageProps} />}</>}
      </main>
      <footer className="page-footer"><span>NexoCRM <span className="footer-separator">/</span> Feito para conectar.</span><span>{dataSource === 'demo' ? 'Alterações salvas neste navegador' : 'Dados do servidor'}</span></footer>
    </div>
    {notice && <div className="toast" role="status"><CheckCircle2 size={19} />{notice}<button className="icon-button" aria-label="Fechar confirmação" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {form && <OpportunityForm clients={data.clients} initialClient={form.clientId} initialStage={form.stage} onSave={createOpportunity} onClose={() => setForm(null)} />}
  </div>;
}
