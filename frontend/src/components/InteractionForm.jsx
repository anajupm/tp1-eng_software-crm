import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { INTERACTION_TYPES, prepareInteraction, validateInteraction } from '../domain/clients.js';

function nowLocalIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function InteractionForm({ client, clients = [], onSave, onClose }) {
  const dialog = useRef(null);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    client_id: client?.id || (clients[0]?.id ?? ''),
    type: 'call',
    description: '',
    occurred_at: nowLocalIso(),
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
    const validationError = validateInteraction(draft, clients);
    if (validationError) { setError(validationError); return; }
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave(prepareInteraction(draft, clients));
    } catch (err) {
      setError(err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} className="opportunity-dialog" aria-labelledby="interaction-form-title"
      onCancel={(e) => { e.preventDefault(); if (!savingRef.current) onClose(); }}>
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">HISTÓRICO DE RELACIONAMENTO</span>
          <h2 id="interaction-form-title">Registrar contato</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} disabled={saving} aria-label="Fechar"><X size={21} /></button>
      </div>
      <p className="muted">Registre ligações, reuniões e conversas com o cliente.</p>
      <form onSubmit={submit} noValidate>
        <fieldset disabled={saving}>
          <div className="form-grid">
            <div>
              <label htmlFor="client_id">Cliente ou lead <span>*</span></label>
              <select id="client_id" name="client_id" value={draft.client_id} onChange={update} disabled={Boolean(client?.id)}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="type">Tipo de contato <span>*</span></label>
              <select id="type" name="type" value={draft.type} onChange={update}>
                {INTERACTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="occurred_at">Data e hora do contato <span>*</span></label>
          <input id="occurred_at" name="occurred_at" type="datetime-local" value={draft.occurred_at} onChange={update} required />
          <label htmlFor="description">Anotações e resumo <span>*</span></label>
          <textarea id="description" name="description" autoFocus rows={3} maxLength={2000} value={draft.description} onChange={update}
            placeholder="Detalhes da conversa, tópicos tratados e próximos passos combinados" required />
        </fieldset>
        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="dialog-footer">
          <span className="muted">* Campos obrigatórios</span>
          <button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="button primary" disabled={saving}>
            <MessageSquare size={16} />{saving ? 'Registrando…' : 'Salvar contato'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
