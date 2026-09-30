import { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { CLIENT_TYPES, prepareClient, validateClient } from '../domain/clients.js';

export default function ClientForm({ initialClient, existingClients = [], onSave, onClose }) {
  const dialog = useRef(null);
  const savingRef = useRef(false);
  const isEdit = Boolean(initialClient?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    name: initialClient?.name || '',
    type: initialClient?.type || 'lead',
    email: initialClient?.email || '',
    company: initialClient?.company || '',
    phone: initialClient?.phone || '',
  });

  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);

  const update = (e) => setDraft((curr) => ({ ...curr, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (savingRef.current) return;
    const validationError = validateClient(draft, existingClients, initialClient?.id);
    if (validationError) { setError(validationError); return; }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave(prepareClient(draft, existingClients, initialClient?.id), initialClient?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="opportunity-dialog client-dialog" aria-labelledby="client-form-title"
      onCancel={(e) => { e.preventDefault(); if (!savingRef.current) onClose(); }}>
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">{isEdit ? 'MANTENHA OS DADOS ATUALIZADOS' : 'CADASTRO DE RELACIONAMENTO'}</span>
          <h2 id="client-form-title">{isEdit ? 'Atualizar cliente' : 'Novo cliente ou lead'}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={21} /></button>
      </div>
      <p className="muted">{isEdit ? 'Edite as informações cadastrais para manter o histórico preciso.' : 'Cadastre contatos e oportunidades para iniciar o relacionamento.'}</p>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={saving}>
          <div className="form-grid">
            <div>
              <label htmlFor="name">Nome completo <span>*</span></label>
              <input id="name" name="name" autoFocus maxLength={120} value={draft.name} onChange={update} placeholder="Ex.: Lucas Mendes" required />
            </div>
            <div>
              <label htmlFor="type">Tipo <span>*</span></label>
              <select id="type" name="type" value={draft.type} onChange={update}>
                {CLIENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="email">E-mail corporativo <span>*</span></label>
          <input id="email" name="email" type="email" value={draft.email} onChange={update} placeholder="lucas@empresa.com" required />
          <div className="form-grid">
            <div>
              <label htmlFor="company">Empresa <small>opcional</small></label>
              <input id="company" name="company" maxLength={120} value={draft.company} onChange={update} placeholder="Nome da empresa" />
            </div>
            <div>
              <label htmlFor="phone">Telefone / Celular <small>opcional</small></label>
              <input id="phone" name="phone" maxLength={40} value={draft.phone} onChange={update} placeholder="(31) 99999-0000" />
            </div>
          </div>
        </fieldset>
        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="dialog-footer">
          <span className="muted">* Campos obrigatórios</span>
          <button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="button primary" disabled={saving}>
            {isEdit ? <Check size={16} /> : <Plus size={16} />}
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
