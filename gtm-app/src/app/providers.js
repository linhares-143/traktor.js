"use client";

import { SessionProvider } from "next-auth/react";
import { AppStateProvider } from "@/context/AppStateContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <AppStateProvider>{children}</AppStateProvider>
    </SessionProvider>
  );
}
