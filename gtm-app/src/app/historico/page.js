"use client";

import { useAppState } from "@/context/AppStateContext";

export default function HistoricoPage() {
  const { history, hydrated } = useAppState();

  if (!hydrated) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="page-title">Histórico desta sessão</h1>
      <p className="page-subtitle">
        Lista do que foi criado por esta ferramenta enquanto esta aba do
        navegador esteve aberta. O histórico é perdido ao fechar a aba.
      </p>

      <div className="card">
        {history.length === 0 && <p>Nenhuma tag criada ainda nesta sessão.</p>}
        {history.map((item) => (
          <div className="list-item" key={item.id}>
            <span>
              <strong>{item.tagName}</strong>
              <br />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {item.containerName} · {item.workspaceName} ·{" "}
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </span>
            </span>
            <span className="badge">{item.platform === "meta" ? "Meta" : "Google Ads"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
