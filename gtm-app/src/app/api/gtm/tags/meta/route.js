import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { createMetaTag } from "@/lib/gtmService";

export const POST = withGtmRoute(async (request, _context, token) => {
  const body = await request.json();
  const {
    workspacePath,
    containerId,
    name,
    pixelId,
    eventName,
    isCustomEvent,
    trigger,
    includeUserData,
  } = body;

  if (!workspacePath || !containerId || !name || !pixelId || !eventName || !trigger) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const result = await createMetaTag(token, workspacePath, {
    containerId,
    name,
    pixelId,
    eventName,
    isCustomEvent: Boolean(isCustomEvent),
    trigger,
    includeUserData: Boolean(includeUserData),
  });

  return NextResponse.json({ result });
});
