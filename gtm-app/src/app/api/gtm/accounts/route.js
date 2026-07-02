import { NextResponse } from "next/server";
import { withGtmRoute } from "@/lib/serverAuth";
import { gtm } from "@/lib/gtmClient";

export const GET = withGtmRoute(async (_request, _context, token) => {
  const data = await gtm.listAccounts(token);
  return NextResponse.json({ accounts: data.account || [] });
});
