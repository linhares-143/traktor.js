"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const LINKS = [
  { href: "/selecionar", label: "Selecionar workspace" },
  { href: "/criar", label: "Criar tag" },
  { href: "/historico", label: "Histórico" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="header">
      <span className="brand">Tags de Conversão · GTM</span>
      {session && (
        <nav>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); signOut({ callbackUrl: "/" }); }}>
            Sair ({session.user?.email})
          </a>
        </nav>
      )}
    </header>
  );
}
