import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { gtm } from "@/lib/gtmClient";

export const GET = withGtmRoute(async (request, _context, token) => {
  const accountPath = new URL(request.url).searchParams.get("accountPath");
  if (!accountPath) {
    return NextResponse.json({ error: "Parâmetro accountPath é obrigatório." }, { status: 400 });
  }
  const data = await gtm.listContainers(token, accountPath);
  return NextResponse.json({ containers: data.container || [] });
});
