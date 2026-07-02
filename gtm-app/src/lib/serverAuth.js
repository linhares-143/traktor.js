import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { errorResponseBody } from "./errors";

export async function getAccessToken() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error) {
    return null;
  }
  return session.accessToken;
}

/**
 * Envolve um handler de rota de API garantindo autenticação e traduzindo
 * qualquer erro da GTM API em uma resposta JSON com mensagem em pt-BR.
 */
export function withGtmRoute(handler) {
  return async (request, context) => {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: "Sessão do Google expirada. Faça login novamente.", code: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    try {
      return await handler(request, context, token);
    } catch (error) {
      console.error("[gtm-api-error]", error);
      const body = errorResponseBody(error);
      const status = error?.status >= 400 && error?.status < 600 ? error.status : 500;
      return NextResponse.json(body, { status });
    }
  };
}
