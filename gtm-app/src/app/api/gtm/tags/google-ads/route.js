import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { createGoogleAdsTag } from "@/lib/gtmService";

export const POST = withGtmRoute(async (request, _context, token) => {
  const body = await request.json();
  const {
    workspacePath,
    name,
    conversionId,
    conversionLabel,
    trigger,
    includeUserData,
  } = body;

  if (!workspacePath || !name || !conversionId || !conversionLabel || !trigger) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const result = await createGoogleAdsTag(token, workspacePath, {
    name,
    conversionId,
    conversionLabel,
    trigger,
    includeUserData: Boolean(includeUserData),
  });

  return NextResponse.json({ result });
});
