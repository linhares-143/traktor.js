import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { gtm } from "@/lib/gtmClient";

export const GET = withGtmRoute(async (request, _context, token) => {
  const containerPath = new URL(request.url).searchParams.get("containerPath");
  if (!containerPath) {
    return NextResponse.json({ error: "Parâmetro containerPath é obrigatório." }, { status: 400 });
  }
  const data = await gtm.listWorkspaces(token, containerPath);
  return NextResponse.json({ workspaces: data.workspace || [] });
});
