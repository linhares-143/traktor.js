"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/selecionar");
    }
  }, [status, router]);

  return (
    <div className="card" style={{ marginTop: 60, textAlign: "center" }}>
      <h1 className="page-title">Tags de Conversão para o GTM</h1>
      <p className="page-subtitle">
        Crie tags de conversão do Meta Pixel e do Google Ads diretamente no seu
        Google Tag Manager, com triggers, variáveis e Enhanced
        Conversions/Advanced Matching configurados automaticamente.
      </p>

      {status === "loading" && <p>Carregando sessão...</p>}

      {status !== "loading" && status !== "authenticated" && (
        <button className="btn btn-primary" onClick={() => signIn("google")}>
          Entrar com o Google
        </button>
      )}

      {session?.error === "RefreshAccessTokenError" && (
        <div className="banner banner-error" style={{ marginTop: 16 }}>
          Sua sessão do Google expirou. Faça login novamente.
        </div>
      )}
    </div>
  );
}
