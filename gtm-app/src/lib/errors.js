export class GtmApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "GtmApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Traduz erros da Google Tag Manager API em mensagens claras em pt-BR.
 * Cobre os casos citados no briefing: permissão negada, nome duplicado,
 * workspace com conflitos e rate limit.
 */
export function translateGtmError(error) {
  const status = error?.status;
  const raw = (error?.message || "").toLowerCase();

  if (status === 401) {
    return {
      code: "UNAUTHENTICATED",
      message:
        "Sua sessão do Google expirou. Faça login novamente para continuar.",
    };
  }

  if (status === 403) {
    return {
      code: "PERMISSION_DENIED",
      message:
        "Permissão negada pelo Google Tag Manager. Verifique se a sua conta Google tem papel de Editor (ou superior) nesse container/workspace.",
    };
  }

  if (status === 429 || raw.includes("rate limit") || raw.includes("quota")) {
    return {
      code: "RATE_LIMITED",
      message:
        "Limite de requisições da API do Google Tag Manager foi atingido. Aguarde alguns instantes e tente novamente.",
    };
  }

  if (
    raw.includes("already exists") ||
    raw.includes("duplicate") ||
    (status === 409 && raw.includes("name"))
  ) {
    return {
      code: "DUPLICATE_NAME",
      message:
        "Já existe um item com esse nome neste workspace. Escolha outro nome ou reutilize o item existente.",
    };
  }

  if (
    status === 409 ||
    raw.includes("conflict") ||
    raw.includes("out of date") ||
    raw.includes("fingerprint")
  ) {
    return {
      code: "WORKSPACE_CONFLICT",
      message:
        "O workspace está com conflitos de sincronização (alguém alterou algo ao mesmo tempo). Abra o GTM, resolva os conflitos do workspace e tente novamente.",
    };
  }

  if (status === 404) {
    return {
      code: "NOT_FOUND",
      message:
        "Conta, container ou workspace não encontrado. Ele pode ter sido removido ou você perdeu o acesso.",
    };
  }

  if (status >= 500) {
    return {
      code: "SERVER_ERROR",
      message:
        "O Google Tag Manager está com instabilidade no momento. Tente novamente em alguns instantes.",
    };
  }

  return {
    code: "UNKNOWN",
    message: error?.message
      ? `Ocorreu um erro ao falar com o Google Tag Manager: ${error.message}`
      : "Ocorreu um erro inesperado ao falar com o Google Tag Manager.",
  };
}

export function errorResponseBody(error) {
  const translated = translateGtmError(error);
  return { error: translated.message, code: translated.code };
}
