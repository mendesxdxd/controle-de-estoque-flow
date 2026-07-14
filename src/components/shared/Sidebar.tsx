"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@iconify/react";

const estoqueIcon = <Icon icon="tabler:archive" width={16} />;

const estoqueSubItems = [
  { href: "/estoque", label: "Movimentações" },
  { href: "/estoque/resumo", label: "Resumo do dia" },
  { href: "/estoque/produto", label: "Produto no estoque" },
];

const ofSubItems = [
  { href: "/ordens-frete", label: "Ordens de Frete" },
  { href: "/estoque/nota", label: "Relatório de OF" },
];

const links = [
  { href: "/dashboard",  label: "Dashboard",  icon: <Icon icon="tabler:layout-dashboard" width={16} /> },
  { href: "/produtos",   label: "Produtos",   icon: <Icon icon="tabler:package" width={16} /> },
  { href: "/categorias", label: "Categorias", icon: <Icon icon="tabler:tags" width={16} /> },
  { href: "/relatorios", label: "Relatórios", icon: <Icon icon="tabler:chart-bar" width={16} /> },
];

const secondaryLinks = [
  { href: "/perfil",   label: "Perfil",    icon: <Icon icon="tabler:user" width={16} /> },
  { href: "/usuarios", label: "Usuários",  adminOnly: true, icon: <Icon icon="tabler:users" width={16} /> },
  { href: "/admin",    label: "Admin",     adminOnly: true, icon: <Icon icon="tabler:shield" width={16} /> },
];

export default function Sidebar({ isAdmin, userEmail, role }: { isAdmin: boolean; userEmail: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [estoqueExpandido, setEstoqueExpandido] = useState(pathname.startsWith("/estoque") && pathname !== "/estoque/nota");
  const [ofExpandido, setOfExpandido] = useState(pathname === "/ordens-frete" || pathname === "/estoque/nota");

  useEffect(() => {
    setEstoqueExpandido(pathname.startsWith("/estoque") && pathname !== "/estoque/nota");
    setOfExpandido(pathname === "/ordens-frete" || pathname === "/estoque/nota");
  }, [pathname]);

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

  const estoqueAtivo = pathname.startsWith("/estoque") && pathname !== "/estoque/nota";
  const ofAtivo = pathname === "/ordens-frete" || pathname === "/estoque/nota";

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
          {aberto ? <Icon icon="tabler:x" width={20} /> : <Icon icon="tabler:menu-2" width={20} />}
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
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setEstoqueExpandido((v) => !v); }}
                className="pr-3 py-2.5 pl-2"
                style={{ color: estoqueAtivo ? "rgba(255,255,255,0.4)" : "#374151" }}
              >
                <Icon icon="tabler:chevron-down" width={12} className={`transition-transform duration-200 ${estoqueExpandido ? "rotate-180" : ""}`} />
              </button>
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

          {/* Ordens de Frete expansivel */}
          <div
            onMouseEnter={() => setOfExpandido(true)}
            onMouseLeave={() => setOfExpandido(false)}
          >
            <div
              className="relative flex items-center rounded-xl overflow-hidden transition-all duration-150"
              style={{ background: ofAtivo ? "rgba(108,99,255,0.12)" : "transparent" }}
            >
              {ofAtivo && <span className="absolute left-0 inset-y-0 w-0.5 bg-brand-primary rounded-r-full" />}
              <Link
                href="/ordens-frete"
                onClick={handleNavegar}
                className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: ofAtivo ? "#fff" : "#6b7280" }}
              >
                <span style={{ color: ofAtivo ? "#8B83FF" : "#4b5563" }}><Icon icon="tabler:truck-delivery" width={16} /></span>
                Ordens de Frete
              </Link>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setOfExpandido((v) => !v); }}
                className="pr-3 py-2.5 pl-2"
                style={{ color: ofAtivo ? "rgba(255,255,255,0.4)" : "#374151" }}
              >
                <Icon icon="tabler:chevron-down" width={12} className={`transition-transform duration-200 ${ofExpandido ? "rotate-180" : ""}`} />
              </button>
            </div>

            <div
              className="ml-7 mt-1 flex flex-col gap-0.5 overflow-hidden transition-all duration-200"
              style={{ maxHeight: ofExpandido ? `${ofSubItems.length * 40}px` : "0px", opacity: ofExpandido ? 1 : 0 }}
            >
              {ofSubItems.map((item) => {
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
          <NavLink href="/relatorios" label="Relatórios" icon={links[3].icon} onClick={handleNavegar} />

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
            <Icon icon="tabler:logout" width={16} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
