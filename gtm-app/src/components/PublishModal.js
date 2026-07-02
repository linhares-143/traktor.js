"use client";

import { useState } from "react";
import { api } from "@/lib/apiClient";

export function PublishModal({ workspacePath, workspaceName, itemsToPublish, onClose, onPublished }) {
  const [name, setName] = useState("Publicação de tags de conversão");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setSubmitting(true);
    setError("");
    try {
      const data = await api.publish({ workspacePath, name, notes });
      onPublished(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Publicar versão</h2>
        <p className="page-subtitle">
          Isso cria uma nova versão do container <strong>{workspaceName}</strong> e a
          publica imediatamente (fica live no site). Depois de publicar, este
          workspace é encerrado pelo GTM — para continuar editando, use outro
          workspace.
        </p>

        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>O que será publicado:</p>
        <ul style={{ fontSize: 13, marginTop: 0, paddingLeft: 18 }}>
          {itemsToPublish.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <div className="field">
          <label>Nome da versão</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Notas (opcional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting}>
            {submitting && <span className="spinner" />}
            {submitting ? "Publicando..." : "Confirmar e publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
