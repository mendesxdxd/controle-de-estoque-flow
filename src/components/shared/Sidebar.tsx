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
  { href: "/estoque/produto", label: "Produto no estoque" },
  { href: "/estoque/nota", label: "Ordem de Frete" },
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
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 overflow-hidden"
        style={{
          background: ativo ? "rgba(108,99,255,0.12)" : "transparent",
          color: ativo ? "#fff" : "#6b7280",
        }}
        onMouseEnter={e => { if (!ativo) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
        onMouseLeave={e => { if (!ativo) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}}
      >
        {ativo && <span className="absolute left-0 inset-y-0 w-0.5 bg-brand-primary rounded-r-full" />}
        <span style={{ color: ativo ? "#8B83FF" : "#4b5563" }}>{icon}</span>
        {label}
      </Link>
    );
  }

  const estoqueAtivo = pathname.startsWith("/estoque");

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <img src="/logo-header.svg" alt="" className="h-7 w-7 object-left" style={{ objectFit: "none", objectPosition: "left center" }} />
          <div className="flex flex-col leading-none">
            <span className="text-base font-black text-white tracking-tight">Flow</span>
            <span className="text-[9px] font-bold tracking-[3px] uppercase" style={{ color: "#8B83FF" }}>Stock</span>
          </div>
        </div>
        <button
          onClick={() => setAberto(!aberto)}
          className="text-brand-light hover:text-white p-1 transition-colors"
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
        w-60 min-h-screen bg-brand-bg backdrop-blur-xl border-r border-brand-border flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${aberto ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-brand-border hidden lg:flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#1a1a2e" }}>
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="22" width="4" height="9" rx="1" fill="#7F77DD" opacity="0.5"/>
              <rect x="9" y="18" width="4" height="13" rx="1" fill="#7F77DD" opacity="0.7"/>
              <rect x="14" y="13" width="4" height="18" rx="1" fill="url(#g)"/>
              <rect x="19" y="18" width="4" height="13" rx="1" fill="#7F77DD" opacity="0.7"/>
              <rect x="24" y="22" width="4" height="9" rx="1" fill="#7F77DD" opacity="0.5"/>
              <polyline points="6,21 11,16 16,12 21,16 26,21" fill="none" stroke="#EEEDFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="12" r="2" fill="#EEEDFE"/>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#AFA9EC"/>
                  <stop offset="100%" stopColor="#534AB7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black text-white tracking-tight">Flow</span>
            <span className="text-[9px] font-bold tracking-[3px] uppercase" style={{ color: "#8B83FF" }}>Stock</span>
          </div>
        </div>

        {/* Espacamento no mobile para o header fixo */}
        <div className="h-14 lg:hidden" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          <NavLink href="/dashboard" label="Dashboard" icon={links[0].icon} onClick={handleNavegar} />
          <NavLink href="/produtos" label="Produtos" icon={links[1].icon} onClick={handleNavegar} />

          {/* Estoque expansivel */}
          <div
            onMouseEnter={() => setEstoqueExpandido(true)}
            onMouseLeave={() => setEstoqueExpandido(false)}
          >
            <div
              className="relative flex items-center rounded-xl overflow-hidden transition-all duration-150"
              style={{ background: estoqueAtivo ? "rgba(108,99,255,0.12)" : "transparent" }}
            >
              {estoqueAtivo && <span className="absolute left-0 inset-y-0 w-0.5 bg-brand-primary rounded-r-full" />}
              <Link
                href="/estoque"
                onClick={handleNavegar}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: estoqueAtivo ? "#fff" : "#6b7280" }}
              >
                <span style={{ color: estoqueAtivo ? "#8B83FF" : "#4b5563" }}>{estoqueIcon}</span>
                Estoque
              </Link>
              <span className="pr-3 py-2.5" style={{ color: estoqueAtivo ? "rgba(255,255,255,0.4)" : "#374151" }}>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`transition-transform duration-200 ${estoqueExpandido ? "rotate-180" : ""}`}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>

            <div
              className="ml-7 mt-1 flex flex-col gap-0.5 overflow-hidden transition-all duration-200"
              style={{ maxHeight: estoqueExpandido ? `${estoqueSubItems.length * 40}px` : "0px", opacity: estoqueExpandido ? 1 : 0 }}
            >
              {estoqueSubItems.map((item) => {
                const subAtivo = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavegar}
                    className="relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 overflow-hidden"
                    style={{
                      color: subAtivo ? "#fff" : "#6b7280",
                      background: subAtivo ? "rgba(108,99,255,0.1)" : "transparent",
                    }}
                  >
                    {subAtivo && (
                      <span className="absolute left-0 inset-y-0 w-0.5 bg-brand-primary rounded-r-full" />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <NavLink href="/categorias" label="Categorias" icon={links[2].icon} onClick={handleNavegar} />
          <NavLink href="/relatorios" label="Relatorios" icon={links[3].icon} onClick={handleNavegar} />

          <div className="mt-4 pt-4 border-t border-brand-border flex flex-col gap-1">
            {secondaryLinks.map((link) => {
              if (link.adminOnly && !isAdmin) return null;
              return (
                <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} onClick={handleNavegar} />
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-5 border-t border-brand-border flex flex-col gap-3">
          <p className="text-xs px-3 truncate" style={{ color: "#4b5563" }}>{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left flex items-center gap-3"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
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
