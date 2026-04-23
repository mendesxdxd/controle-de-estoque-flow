"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const estoqueIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

const estoqueSubItems = [
  { href: "/estoque", label: "Movimentacoes" },
  { href: "/estoque/resumo", label: "Resumo do dia" },
  { href: "/estoque/produto", label: "Por produto" },
  { href: "/estoque/nota", label: "Por nota" },
];

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/produtos",
    label: "Produtos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" x2="12" y1="22" y2="12" />
      </svg>
    ),
  },
  {
    href: "/categorias",
    label: "Categorias",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
        <path d="M6 9.01V9" />
        <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
      </svg>
    ),
  },
  {
    href: "/relatorios",
    label: "Relatorios",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
];

const secondaryLinks = [
  {
    href: "/perfil",
    label: "Perfil",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    adminOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin",
    label: "Admin",
    adminOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 1 5 5c0 3.5-2.5 6-5 8-2.5-2-5-4.5-5-8a5 5 0 0 1 5-5z" />
        <path d="M12 22v-4" />
        <path d="M8 22h8" />
      </svg>
    ),
  },
];

export default function Sidebar({ isAdmin, userEmail }: { isAdmin: boolean; userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [estoqueExpandido, setEstoqueExpandido] = useState(pathname.startsWith("/estoque"));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNavegar() {
    setAberto(false);
  }

  function NavLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
    const ativo = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          ativo
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
        }`}
      >
        <span className={ativo ? "text-white" : "text-zinc-500"}>{icon}</span>
        {label}
      </Link>
    );
  }

  const estoqueAtivo = pathname.startsWith("/estoque");

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 border-b border-white/[0.06]">
        <img src="/logo-header.svg" alt="FlowStock" className="h-7" />
        <button
          onClick={() => setAberto(!aberto)}
          className="text-zinc-400 hover:text-white p-1 transition-colors"
          aria-label="Menu"
        >
          {aberto ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setAberto(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-60 min-h-screen bg-zinc-950/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${aberto ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06] hidden lg:flex items-center">
          <img src="/logo-header.svg" alt="FlowStock" className="h-9" />
        </div>

        {/* Espacamento no mobile para o header fixo */}
        <div className="h-14 lg:hidden" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <NavLink href="/dashboard" label="Dashboard" icon={links[0].icon} onClick={handleNavegar} />
          <NavLink href="/produtos" label="Produtos" icon={links[1].icon} onClick={handleNavegar} />

          {/* Estoque expansivel */}
          <div>
            <div className={`flex items-center rounded-xl transition-all duration-150 ${estoqueAtivo ? "bg-white/10" : "hover:bg-white/5"}`}>
              <Link
                href="/estoque"
                onClick={handleNavegar}
                className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  estoqueAtivo ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <span className={estoqueAtivo ? "text-white" : "text-zinc-500"}>{estoqueIcon}</span>
                Estoque
              </Link>
              <button
                onClick={() => setEstoqueExpandido((v) => !v)}
                className={`pr-3 py-2.5 transition-colors ${estoqueAtivo ? "text-white/60 hover:text-white" : "text-zinc-600 hover:text-zinc-400"}`}
                aria-label="Expandir estoque"
              >
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`transition-transform duration-200 ${estoqueExpandido ? "rotate-180" : ""}`}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {estoqueExpandido && (
              <div className="ml-7 mt-1 flex flex-col gap-0.5">
                {estoqueSubItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavegar}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink href="/categorias" label="Categorias" icon={links[2].icon} onClick={handleNavegar} />
          <NavLink href="/relatorios" label="Relatorios" icon={links[3].icon} onClick={handleNavegar} />

          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-1">
            {secondaryLinks.map((link) => {
              if (link.adminOnly && !isAdmin) return null;
              return (
                <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} onClick={handleNavegar} />
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-5 border-t border-white/[0.06] flex flex-col gap-3">
          <p className="text-xs text-zinc-600 px-3 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-150 text-left flex items-center gap-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
