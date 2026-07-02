import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { publishWorkspace } from "@/lib/gtmService";

export const POST = withGtmRoute(async (request, _context, token) => {
  const body = await request.json();
  const { workspacePath, name, notes } = body;

  if (!workspacePath) {
    return NextResponse.json({ error: "Parâmetro workspacePath é obrigatório." }, { status: 400 });
  }

  const result = await publishWorkspace(token, workspacePath, {
    name: name || "Publicado via app de tags de conversão",
    notes: notes || "",
  });

  return NextResponse.json({ result });
});
