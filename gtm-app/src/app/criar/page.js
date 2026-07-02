"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/apiClient";
import { useAppState } from "@/context/AppStateContext";

const META_STANDARD_EVENTS = [
  "Lead",
  "Purchase",
  "CompleteRegistration",
  "Contact",
  "AddToCart",
  "InitiateCheckout",
];

const NEW_TRIGGER_OPTION = "__new_trigger__";

export default function CriarPage() {
  const { status } = useSession();
  const router = useRouter();
  const { selection, hydrated, setLastResult, addHistoryEntry } = useAppState();

  const [platform, setPlatform] = useState("google_ads");
  const [tagName, setTagName] = useState("");

  const [conversionId, setConversionId] = useState("");
  const [conversionLabel, setConversionLabel] = useState("");

  const [pixelId, setPixelId] = useState("");
  const [metaEventChoice, setMetaEventChoice] = useState(META_STANDARD_EVENTS[0]);
  const [customEventName, setCustomEventName] = useState("");

  const [includeUserData, setIncludeUserData] = useState(false);

  const [triggers, setTriggers] = useState([]);
  const [triggersLoading, setTriggersLoading] = useState(false);
  const [selectedTriggerId, setSelectedTriggerId] = useState("");

  const [newTriggerType, setNewTriggerType] = useState("customEvent");
  const [newTriggerName, setNewTriggerName] = useState("");
  const [newTriggerEventName, setNewTriggerEventName] = useState("");
  const [newTriggerFormCondition, setNewTriggerFormCondition] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (hydrated && !selection) {
      router.replace("/selecionar");
    }
  }, [hydrated, selection, router]);

  useEffect(() => {
    if (!selection?.workspace?.path) return;
    setTriggersLoading(true);
    api
      .listTriggers(selection.workspace.path)
      .then((data) => setTriggers(data.triggers || []))
      .catch((e) => setError(e.message))
      .finally(() => setTriggersLoading(false));
  }, [selection]);

  if (!hydrated || !selection) {
    return <p>Carregando...</p>;
  }

  const isCreatingNewTrigger = selectedTriggerId === NEW_TRIGGER_OPTION;

  function buildTriggerPayload() {
    if (isCreatingNewTrigger) {
      if (!newTriggerName.trim()) throw new Error("Informe um nome para o novo acionador.");
      if (newTriggerType === "customEvent") {
        if (!newTriggerEventName.trim()) throw new Error("Informe o nome do evento customizado do acionador.");
        return {
          mode: "new",
          type: "customEvent",
          name: newTriggerName.trim(),
          eventName: newTriggerEventName.trim(),
        };
      }
      if (!newTriggerFormCondition.trim()) throw new Error("Informe a condição (ex: Form ID) do acionador.");
      return {
        mode: "new",
        type: "formSubmission",
        name: newTriggerName.trim(),
        formCondition: newTriggerFormCondition.trim(),
      };
    }
    if (!selectedTriggerId) throw new Error("Selecione um acionador.");
    return { mode: "existing", triggerId: selectedTriggerId };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!tagName.trim()) {
      setError("Informe um nome para a tag.");
      return;
    }

    let triggerPayload;
    try {
      triggerPayload = buildTriggerPayload();
    } catch (err) {
      setError(err.message);
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (platform === "google_ads") {
        if (!conversionId.trim() || !conversionLabel.trim()) {
          throw new Error("Informe o Conversion ID e o Conversion Label.");
        }
        const data = await api.createGoogleAdsTag({
          workspacePath: selection.workspace.path,
          name: tagName.trim(),
          conversionId: conversionId.trim(),
          conversionLabel: conversionLabel.trim(),
          trigger: triggerPayload,
          includeUserData,
        });
        result = { platform: "google_ads", tagName: tagName.trim(), ...data.result };
      } else {
        const eventName = metaEventChoice === "custom" ? customEventName.trim() : metaEventChoice;
        if (!pixelId.trim()) throw new Error("Informe o Pixel ID.");
        if (!eventName) throw new Error("Informe o nome do evento.");
        const data = await api.createMetaTag({
          workspacePath: selection.workspace.path,
          containerId: selection.container.containerId,
          name: tagName.trim(),
          pixelId: pixelId.trim(),
          eventName,
          isCustomEvent: metaEventChoice === "custom",
          trigger: triggerPayload,
          includeUserData,
        });
        result = { platform: "meta", tagName: tagName.trim(), ...data.result };
      }

      const fullResult = {
        ...result,
        includeUserData,
        selection,
        triggerInput: triggerPayload,
        createdAt: new Date().toISOString(),
      };
      setLastResult(fullResult);
      addHistoryEntry({
        platform: result.platform,
        tagName: result.tagName,
        createdAt: fullResult.createdAt,
        workspaceName: selection.workspace.name,
        containerName: selection.container.name,
      });
      router.push("/sucesso");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="step-indicator">
        <div className="dot done" />
        <div className="dot done" />
        <div className="dot" />
      </div>
      <h1 className="page-title">Criar tag de conversão</h1>
      <p className="page-subtitle">
        Workspace: <strong>{selection.workspace.name}</strong> · Container:{" "}
        <strong>{selection.container.name}</strong>
      </p>

      {error && <div className="banner banner-error">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label>Plataforma</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="google_ads">Google Ads</option>
            <option value="meta">Meta (Facebook/Instagram)</option>
          </select>
        </div>

        {platform === "google_ads" && (
          <>
            <div className="field">
              <label>Conversion ID</label>
              <input type="text" value={conversionId} onChange={(e) => setConversionId(e.target.value)} placeholder="Ex: 123456789" />
            </div>
            <div className="field">
              <label>Conversion Label</label>
              <input type="text" value={conversionLabel} onChange={(e) => setConversionLabel(e.target.value)} placeholder="Ex: AbCdEfGhIjKl123" />
            </div>
          </>
        )}

        {platform === "meta" && (
          <>
            <div className="field">
              <label>Pixel ID</label>
              <input type="text" value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="Ex: 123456789012345" />
            </div>
            <div className="field">
              <label>Evento</label>
              <select value={metaEventChoice} onChange={(e) => setMetaEventChoice(e.target.value)}>
                {META_STANDARD_EVENTS.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
                <option value="custom">Evento customizado...</option>
              </select>
            </div>
            {metaEventChoice === "custom" && (
              <div className="field">
                <label>Nome do evento customizado</label>
                <input type="text" value={customEventName} onChange={(e) => setCustomEventName(e.target.value)} placeholder="Ex: agendamento_concluido" />
              </div>
            )}
          </>
        )}

        <div className="field">
          <label>Nome da tag</label>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder={platform === "google_ads" ? "Ex: Google Ads - Conversão Lead" : "Ex: Meta Pixel - Lead"}
          />
        </div>

        <div className="field">
          <label>Acionador (trigger)</label>
          <select value={selectedTriggerId} onChange={(e) => setSelectedTriggerId(e.target.value)}>
            <option value="">{triggersLoading ? "Carregando..." : "Selecione um acionador"}</option>
            {triggers.map((t) => (
              <option key={t.triggerId} value={t.triggerId}>{t.name}</option>
            ))}
            <option value={NEW_TRIGGER_OPTION}>+ Criar novo acionador</option>
          </select>
        </div>

        {isCreatingNewTrigger && (
          <div className="card" style={{ background: "#fafbfc" }}>
            <div className="field">
              <label>Nome do novo acionador</label>
              <input type="text" value={newTriggerName} onChange={(e) => setNewTriggerName(e.target.value)} placeholder="Ex: CE - Formulário enviado" />
            </div>
            <div className="field">
              <label>Tipo de acionador</label>
              <select value={newTriggerType} onChange={(e) => setNewTriggerType(e.target.value)}>
                <option value="customEvent">Custom Event</option>
                <option value="formSubmission">Form Submission</option>
              </select>
            </div>
            {newTriggerType === "customEvent" ? (
              <div className="field">
                <label>Nome do evento (dataLayer.push)</label>
                <input
                  type="text"
                  value={newTriggerEventName}
                  onChange={(e) => setNewTriggerEventName(e.target.value)}
                  placeholder="Ex: form_enviado"
                />
                <p className="hint">
                  Dispara quando existir <code>dataLayer.push(&#123; event: &quot;{newTriggerEventName || "form_enviado"}&quot; &#125;)</code>
                </p>
              </div>
            ) : (
              <div className="field">
                <label>Condição (Form ID)</label>
                <input
                  type="text"
                  value={newTriggerFormCondition}
                  onChange={(e) => setNewTriggerFormCondition(e.target.value)}
                  placeholder="Ex: form-contato"
                />
                <p className="hint">
                  Dispara quando a variável integrada &quot;Form ID&quot; for igual a este valor.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="field checkbox-row">
          <input
            type="checkbox"
            id="includeUserData"
            checked={includeUserData}
            onChange={(e) => setIncludeUserData(e.target.checked)}
          />
          <label htmlFor="includeUserData" style={{ marginBottom: 0 }}>
            Incluir dados do usuário (Enhanced Conversions / Advanced Matching)
          </label>
        </div>

        <div className="btn-row">
          <button type="button" className="btn btn-secondary" onClick={() => router.push("/selecionar")}>
            Voltar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <span className="spinner" />}
            {submitting ? "Criando..." : "Criar tag"}
          </button>
        </div>
      </form>
    </div>
  );
}
