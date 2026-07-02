"use client";

async function request(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Erro inesperado.");
    error.code = data.code;
    throw error;
  }
  return data;
}

export const api = {
  listAccounts: () => request("/api/gtm/accounts"),
  listContainers: (accountPath) =>
    request(`/api/gtm/containers?accountPath=${encodeURIComponent(accountPath)}`),
  listWorkspaces: (containerPath) =>
    request(`/api/gtm/workspaces?containerPath=${encodeURIComponent(containerPath)}`),
  listTriggers: (workspacePath) =>
    request(`/api/gtm/triggers?workspacePath=${encodeURIComponent(workspacePath)}`),
  createGoogleAdsTag: (payload) =>
    request("/api/gtm/tags/google-ads", { method: "POST", body: JSON.stringify(payload) }),
  createMetaTag: (payload) =>
    request("/api/gtm/tags/meta", { method: "POST", body: JSON.stringify(payload) }),
  publish: (payload) => request("/api/gtm/publish", { method: "POST", body: JSON.stringify(payload) }),
};
