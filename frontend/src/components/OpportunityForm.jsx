import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { prepareOpportunity, STAGES, validateOpportunity } from '../domain/opportunities.js';

export default function OpportunityForm({ clients, initialClient, initialStage, onSave, onClose }) {
  const dialog = useRef(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [draft, setDraft] = useState({ title: '', client_id: initialClient || '', value: '',
    stage: initialStage || 'new', expected_close_date: '', notes: '' });
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  const update = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const field = (name) => ({ name, id: name, value: draft[name], onChange: update,
    'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const fieldError = (name) => errors[name] && <small className="field-error" id={`${name}-error`}>{errors[name]}</small>;
  async function submit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    const nextErrors = validateOpportunity(draft, clients);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      dialog.current.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try { await onSave(prepareOpportunity(draft, clients)); }
    catch (failure) { setError(failure.message); }
    finally { savingRef.current = false; setSaving(false); }
  }
  return <dialog ref={dialog} className="opportunity-dialog" aria-labelledby="form-title"
    onCancel={(event) => { event.preventDefault(); if (!savingRef.current) onClose(); }}>
    <div className="dialog-heading"><div><span className="eyebrow">UM NOVO NEGÓCIO COMEÇA AQUI</span>
      <h2 id="form-title">Nova oportunidade</h2></div>
      <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Fechar formulário"><X size={21} /></button></div>
    <p className="muted">Conecte uma oportunidade ao próximo passo do seu cliente.</p>
    <form onSubmit={submit} noValidate>
      <fieldset disabled={saving}>
        <label htmlFor="title">Título <span>*</span></label>
        <input {...field('title')} autoFocus maxLength={120} placeholder="Ex.: Consultoria para expansão" required />{fieldError('title')}
        <label htmlFor="client_id">Cliente ou lead <span>*</span></label>
        <select {...field('client_id')} required><option value="">Selecione um contato</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ''}</option>)}</select>{fieldError('client_id')}
        <div className="form-grid"><div><label htmlFor="value">Valor estimado (R$) <span>*</span></label>
          <input {...field('value')} type="number" min="0" max="999999999.99" step="0.01" placeholder="0,00" required />{fieldError('value')}</div>
          <div><label htmlFor="stage">Etapa <span>*</span></label><select {...field('stage')}>
            {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select>{fieldError('stage')}</div></div>
        <label htmlFor="expected_close_date">Previsão de fechamento <small>opcional</small></label>
        <input {...field('expected_close_date')} type="date" />{fieldError('expected_close_date')}
        <label htmlFor="notes">Observações <small>opcional</small></label>
        <textarea {...field('notes')} rows={3} maxLength={2000} placeholder="Contexto e próximos passos da negociação" />{fieldError('notes')}
      </fieldset>
      {error && <p className="error-box" role="alert">{error}</p>}
      <div className="dialog-footer"><span className="muted">* Campos obrigatórios</span>
        <button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button>
        <button type="submit" className="button primary" disabled={saving || !clients.length}>
          <Plus size={16} />{saving ? 'Salvando…' : 'Criar oportunidade'}</button></div>
    </form>
  </dialog>;
}
