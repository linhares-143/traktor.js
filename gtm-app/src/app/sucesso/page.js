"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { gtmWorkspaceUrl } from "@/lib/constants";
import { PublishModal } from "@/components/PublishModal";

function DataLayerSnippet({ eventName }) {
  const code = `dataLayer.push({
  event: '${eventName}',
  user_email: email,      // minúsculas, sem espaços
  user_phone: telefone,   // formato E.164, ex: +5511999999999
  user_first_name: nome,
  user_last_name: sobrenome
});
// Envie este push somente depois que o usuário der consentimento
// (LGPD/cookie banner) para uso de dados pessoais em marketing.`;
  return <pre className="snippet">{code}</pre>;
}

export default function SucessoPage() {
  const router = useRouter();
  const { lastResult, hydrated } = useAppState();
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedInfo, setPublishedInfo] = useState(null);

  if (!hydrated) return <p>Carregando...</p>;

  if (!lastResult) {
    return (
      <div className="card">
        <p>Nenhuma criação recente encontrada nesta sessão.</p>
        <button className="btn btn-primary" onClick={() => router.push("/criar")}>
          Criar uma tag
        </button>
      </div>
    );
  }

  const {
    platform,
    tagName,
    tag,
    triggerResult,
    linkerResult,
    templateResult,
    eventIdVar,
    userDataVars = [],
    includeUserData,
    triggerInput,
    selection,
  } = lastResult;

  const workspaceLink = gtmWorkspaceUrl(
    selection.account.accountId,
    selection.container.containerId,
    selection.workspace.workspaceId
  );

  const itemsToPublish = [`Tag "${tagName}"`];
  if (triggerResult?.created) itemsToPublish.push(`Novo acionador "${triggerResult.name || triggerInput?.name}"`);
  if (linkerResult?.created) itemsToPublish.push('Tag "Conversion Linker"');
  if (templateResult?.created) itemsToPublish.push('Template "Meta Pixel" importado da galeria');
  if (eventIdVar?.created) itemsToPublish.push(`Variável "${eventIdVar.name}"`);
  userDataVars.filter((v) => v.created).forEach((v) => itemsToPublish.push(`Variável "${v.name}"`));

  return (
    <div>
      <div className="step-indicator">
        <div className="dot done" />
        <div className="dot done" />
        <div className="dot done" />
      </div>

      <div className="banner banner-success">Tag criada com sucesso como rascunho no workspace.</div>

      <div className="card">
        <h1 className="page-title">Resumo da criação</h1>
        <p className="page-subtitle">
          Workspace <strong>{selection.workspace.name}</strong> · Container{" "}
          <strong>{selection.container.name}</strong>
        </p>

        <div className="list-item">
          <span>Tag {platform === "meta" ? "Meta Pixel" : "Google Ads"}</span>
          <span className="badge">{tagName}</span>
        </div>
        <div className="list-item">
          <span>Acionador</span>
          <span className="badge">
            {triggerResult?.created ? "criado" : triggerResult?.reused ? "reaproveitado" : "existente"}
          </span>
        </div>

        {platform === "google_ads" && (
          <div className="list-item">
            <span>Conversion Linker</span>
            <span className="badge">{linkerResult?.created ? "criado agora" : "já existia"}</span>
          </div>
        )}

        {platform === "meta" && (
          <>
            <div className="list-item">
              <span>Template "Meta Pixel" (Community Gallery)</span>
              <span className="badge">{templateResult?.created ? "importado agora" : "já existia"}</span>
            </div>
            <div className="list-item">
              <span>Variável de Event ID (deduplicação)</span>
              <span className="badge">{eventIdVar?.created ? "criada" : "já existia"}</span>
            </div>
          </>
        )}

        {includeUserData &&
          userDataVars.map((v) => (
            <div className="list-item" key={v.name}>
              <span>Variável {v.name}</span>
              <span className="badge">{v.created ? "criada" : "já existia"}</span>
            </div>
          ))}

        {platform === "google_ads" && includeUserData && (
          <div className="banner banner-warning" style={{ marginTop: 12 }}>
            Enhanced Conversions foi habilitado e mapeado para as variáveis de
            dataLayer. O Google não documenta publicamente os nomes internos
            desses campos na API — abra a tag no GTM uma vez para confirmar que
            o mapeamento de e-mail/telefone/nome aparece corretamente e ajuste
            se necessário.
          </div>
        )}

        <p style={{ marginTop: 16 }}>
          <a href={workspaceLink} target="_blank" rel="noreferrer">
            Abrir este workspace no Google Tag Manager →
          </a>
        </p>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => router.push("/criar")}>
            Criar outra tag
          </button>
          <button className="btn btn-primary" onClick={() => setPublishOpen(true)}>
            Publicar versão
          </button>
        </div>
      </div>

      {includeUserData && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Snippet para o desenvolvedor</h2>
          <p className="page-subtitle">
            Cole este trecho no site, no envio do formulário (ou evento
            correspondente), preenchendo as variáveis com os dados reais do
            usuário.
          </p>
          <DataLayerSnippet eventName={triggerInput?.eventName || triggerInput?.name || "form_enviado"} />
        </div>
      )}

      {publishOpen && (
        <PublishModal
          workspacePath={selection.workspace.path}
          workspaceName={selection.workspace.name}
          itemsToPublish={itemsToPublish}
          onClose={() => setPublishOpen(false)}
          onPublished={(result) => {
            setPublishedInfo(result);
            setPublishOpen(false);
          }}
        />
      )}

      {publishedInfo && (
        <div className="banner banner-success">
          Versão "{publishedInfo.containerVersion.name}" publicada com sucesso!
        </div>
      )}
    </div>
  );
}
