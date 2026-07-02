"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/apiClient";
import { useAppState } from "@/context/AppStateContext";

export default function SelecionarPage() {
  const { status } = useSession();
  const router = useRouter();
  const { selection, setSelection, hydrated } = useAppState();

  const [accounts, setAccounts] = useState([]);
  const [containers, setContainers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);

  const [accountPath, setAccountPath] = useState("");
  const [containerPath, setContainerPath] = useState("");
  const [workspacePath, setWorkspacePath] = useState("");

  const [loading, setLoading] = useState({ accounts: false, containers: false, workspaces: false });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading((l) => ({ ...l, accounts: true }));
    api
      .listAccounts()
      .then((data) => setAccounts(data.accounts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading((l) => ({ ...l, accounts: false })));
  }, [status]);

  useEffect(() => {
    if (hydrated && selection?.account?.path) {
      setAccountPath(selection.account.path);
    }
  }, [hydrated, selection]);

  useEffect(() => {
    if (!accountPath) {
      setContainers([]);
      return;
    }
    setLoading((l) => ({ ...l, containers: true }));
    setError("");
    api
      .listContainers(accountPath)
      .then((data) => setContainers(data.containers))
      .catch((e) => setError(e.message))
      .finally(() => setLoading((l) => ({ ...l, containers: false })));
  }, [accountPath]);

  useEffect(() => {
    if (hydrated && selection?.container?.path && containers.some((c) => c.path === selection.container.path)) {
      setContainerPath(selection.container.path);
    }
  }, [hydrated, selection, containers]);

  useEffect(() => {
    if (!containerPath) {
      setWorkspaces([]);
      return;
    }
    setLoading((l) => ({ ...l, workspaces: true }));
    setError("");
    api
      .listWorkspaces(containerPath)
      .then((data) => setWorkspaces(data.workspaces))
      .catch((e) => setError(e.message))
      .finally(() => setLoading((l) => ({ ...l, workspaces: false })));
  }, [containerPath]);

  useEffect(() => {
    if (hydrated && selection?.workspace?.path && workspaces.some((w) => w.path === selection.workspace.path)) {
      setWorkspacePath(selection.workspace.path);
    }
  }, [hydrated, selection, workspaces]);

  function handleContinue() {
    const account = accounts.find((a) => a.path === accountPath);
    const container = containers.find((c) => c.path === containerPath);
    const workspace = workspaces.find((w) => w.path === workspacePath);
    if (!account || !container || !workspace) return;
    setSelection({ account, container, workspace });
    router.push("/criar");
  }

  return (
    <div>
      <div className="step-indicator">
        <div className="dot done" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <h1 className="page-title">Selecione onde criar a tag</h1>
      <p className="page-subtitle">
        Escolha a conta, o container e o workspace do Google Tag Manager onde as
        tags, triggers e variáveis serão criadas (tudo como rascunho).
      </p>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="card">
        <div className="field">
          <label>Conta GTM</label>
          <select value={accountPath} onChange={(e) => { setAccountPath(e.target.value); setContainerPath(""); setWorkspacePath(""); }}>
            <option value="">{loading.accounts ? "Carregando..." : "Selecione uma conta"}</option>
            {accounts.map((a) => (
              <option key={a.path} value={a.path}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Container</label>
          <select
            value={containerPath}
            disabled={!accountPath}
            onChange={(e) => { setContainerPath(e.target.value); setWorkspacePath(""); }}
          >
            <option value="">{loading.containers ? "Carregando..." : "Selecione um container"}</option>
            {containers.map((c) => (
              <option key={c.path} value={c.path}>{c.name} ({c.publicId})</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Workspace</label>
          <select
            value={workspacePath}
            disabled={!containerPath}
            onChange={(e) => setWorkspacePath(e.target.value)}
          >
            <option value="">{loading.workspaces ? "Carregando..." : "Selecione um workspace"}</option>
            {workspaces.map((w) => (
              <option key={w.path} value={w.path}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="btn-row">
          <button className="btn btn-primary" disabled={!workspacePath} onClick={handleContinue}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
