import { GtmApiError } from "./errors";

const BASE_URL = "https://tagmanager.googleapis.com/tagmanager/v2";

async function gtmRequest(accessToken, path, { method = "GET", body, query } = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = json?.error?.message || response.statusText;
    throw new GtmApiError(response.status, message, json?.error);
  }

  return json;
}

export const gtm = {
  listAccounts: (token) => gtmRequest(token, "accounts"),

  listContainers: (token, accountPath) =>
    gtmRequest(token, `${accountPath}/containers`),

  listWorkspaces: (token, containerPath) =>
    gtmRequest(token, `${containerPath}/workspaces`),

  listTriggers: (token, workspacePath) =>
    gtmRequest(token, `${workspacePath}/triggers`),

  createTrigger: (token, workspacePath, trigger) =>
    gtmRequest(token, `${workspacePath}/triggers`, { method: "POST", body: trigger }),

  listVariables: (token, workspacePath) =>
    gtmRequest(token, `${workspacePath}/variables`),

  createVariable: (token, workspacePath, variable) =>
    gtmRequest(token, `${workspacePath}/variables`, { method: "POST", body: variable }),

  listBuiltInVariables: (token, workspacePath) =>
    gtmRequest(token, `${workspacePath}/built_in_variables`),

  enableBuiltInVariable: (token, workspacePath, type) =>
    gtmRequest(token, `${workspacePath}/built_in_variables`, {
      method: "POST",
      query: { type },
    }),

  listTags: (token, workspacePath) => gtmRequest(token, `${workspacePath}/tags`),

  createTag: (token, workspacePath, tag) =>
    gtmRequest(token, `${workspacePath}/tags`, { method: "POST", body: tag }),

  listTemplates: (token, workspacePath) =>
    gtmRequest(token, `${workspacePath}/templates`),

  createTemplate: (token, workspacePath, template) =>
    gtmRequest(token, `${workspacePath}/templates`, { method: "POST", body: template }),

  createVersion: (token, workspacePath, versionOptions) =>
    gtmRequest(token, `${workspacePath}:create_version`, {
      method: "POST",
      body: versionOptions,
    }),

  publishVersion: (token, versionPath) =>
    gtmRequest(token, `${versionPath}:publish`, { method: "POST" }),
};
