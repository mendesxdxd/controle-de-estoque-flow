"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/produtos", label: "Produtos" },
  { href: "/estoque", label: "Estoque" },
  { href: "/categorias", label: "Categorias" },
  { href: "/relatorios", label: "Relatorios" },
];

export default function Sidebar({ isAdmin, userEmail }: { isAdmin: boolean; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNavegar() {
    setAberto(false);
  }

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black h-14 flex items-center justify-between px-4 border-b border-neutral-800">
        <span className="text-white text-sm font-bold tracking-tight uppercase">
          Controle do CHIP
        </span>
        <button
          onClick={() => setAberto(!aberto)}
          className="text-white p-1"
          aria-label="Menu"
        >
          {aberto ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay mobile */}
      {aberto && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-56 min-h-screen bg-black flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${aberto ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="px-6 py-8 border-b border-neutral-800 hidden lg:block">
          <span className="text-white text-sm font-bold tracking-tight uppercase">
            Controle do CHIP
          </span>
        </div>

        {/* Espacamento no mobile para o header fixo */}
        <div className="h-14 lg:hidden" />

        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {links.map((link) => {
            const ativo = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleNavegar}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l-[3px] ${
                  ativo
                    ? "border-white text-white bg-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-1">
            <Link
              href="/perfil"
              onClick={handleNavegar}
              className={`px-3 py-2 text-sm font-medium transition-colors border-l-[3px] ${
                pathname === "/perfil"
                  ? "border-white text-white bg-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              Perfil
            </Link>

            {isAdmin && (
              <Link
                href="/usuarios"
                onClick={handleNavegar}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l-[3px] ${
                  pathname === "/usuarios"
                    ? "border-white text-white bg-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                Usuarios
              </Link>
            )}
          </div>
        </nav>

        <div className="px-3 py-6 border-t border-neutral-800 flex flex-col gap-3">
          <p className="text-xs text-neutral-500 px-3 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-100 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none transition-all duration-150 text-left"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
