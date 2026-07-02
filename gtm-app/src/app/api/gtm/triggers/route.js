import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { gtm } from "@/lib/gtmClient";

export const GET = withGtmRoute(async (request, _context, token) => {
  const workspacePath = new URL(request.url).searchParams.get("workspacePath");
  if (!workspacePath) {
    return NextResponse.json({ error: "Parâmetro workspacePath é obrigatório." }, { status: 400 });
  }
  const data = await gtm.listTriggers(token, workspacePath);
  return NextResponse.json({ triggers: data.trigger || [] });
});
