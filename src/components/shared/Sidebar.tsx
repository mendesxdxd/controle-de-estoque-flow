"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@iconify/react";

type SubItem = { href: string; label: string };

type ItemNav = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  sub?: SubItem[];
  // Alguns itens ficam ativos em rotas que nao sao prefixo do href (ex: o
  // grupo de OF cobre /estoque/nota). Quando presente, decide a ativacao.
  match?: (pathname: string) => boolean;
};

type Secao = { titulo?: string; itens: ItemNav[] };

const SECOES: Secao[] = [
  {
    itens: [{ href: "/dashboard", label: "Dashboard", icon: "tabler:layout-dashboard" }],
  },
  {
    titulo: "Operação",
    itens: [
      {
        href: "/estoque",
        label: "Estoque",
        icon: "tabler:archive",
        match: (p) => p.startsWith("/estoque") && p !== "/estoque/nota",
        sub: [
          { href: "/estoque", label: "Movimentações" },
          { href: "/estoque/resumo", label: "Resumo do dia" },
          { href: "/estoque/produto", label: "Produto no estoque" },
        ],
      },
      {
        href: "/ordens-frete",
        label: "Ordens de Frete",
        icon: "tabler:truck-delivery",
        match: (p) => p === "/ordens-frete" || p === "/estoque/nota",
        sub: [
          { href: "/ordens-frete", label: "Saldo por produto" },
          { href: "/estoque/nota", label: "Relatório de OF" },
        ],
      },
      { href: "/conferencia", label: "Conferência", icon: "tabler:checkup-list" },
      { href: "/relatorios", label: "Relatórios", icon: "tabler:chart-bar" },
    ],
  },
  {
    titulo: "Cadastro",
    itens: [
      { href: "/produtos", label: "Produtos", icon: "tabler:package" },
      { href: "/categorias", label: "Categorias", icon: "tabler:tags" },
    ],
  },
];

const CONTA: ItemNav[] = [
  { href: "/perfil", label: "Perfil", icon: "tabler:user" },
  { href: "/usuarios", label: "Usuários", icon: "tabler:users", adminOnly: true },
  { href: "/admin", label: "Admin", icon: "tabler:shield", adminOnly: true },
];

function estaAtivo(item: ItemNav, pathname: string) {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/** Item simples (sem submenu). Fora do Sidebar para nao recriar a cada render. */
function NavItem({ item, onNavegar }: { item: ItemNav; onNavegar: () => void }) {
  const pathname = usePathname();
  return (
    <Link href={item.href} onClick={onNavegar} className="nav-item" data-ativo={estaAtivo(item, pathname)}>
      <span className="nav-icon"><Icon icon={item.icon} width={16} /></span>
      {item.label}
    </Link>
  );
}

/** Item com submenu expansivel. */
function NavGrupo({ item, onNavegar }: { item: ItemNav; onNavegar: () => void }) {
  const pathname = usePathname();
  const ativo = estaAtivo(item, pathname);
  // aberto = ativo (a secao atual fica aberta) ou aberto manualmente pelo usuario.
  // Derivar evita o useEffect que sincronizava expansao com a rota.
  const [abertoManual, setAbertoManual] = useState(false);
  const aberto = ativo || abertoManual;

  return (
    <div className="nav-grupo" data-ativo={ativo}>
      <div className="flex items-center">
        <Link href={item.href} onClick={onNavegar} className="nav-item flex-1" data-ativo={ativo}>
          <span className="nav-icon"><Icon icon={item.icon} width={16} /></span>
          {item.label}
        </Link>
        <button
          type="button"
          onClick={() => setAbertoManual((v) => !v)}
          className="nav-expandir"
          aria-expanded={aberto}
          aria-label={`${aberto ? "Recolher" : "Expandir"} ${item.label}`}
        >
          <Icon icon="tabler:chevron-down" width={12} className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        className="ml-7 mt-1 flex flex-col gap-0.5 overflow-hidden transition-all duration-200"
        style={{ maxHeight: aberto ? `${(item.sub?.length ?? 0) * 40}px` : "0px", opacity: aberto ? 1 : 0 }}
      >
        {item.sub?.map((s) => (
          <SubLink key={s.href} sub={s} onNavegar={onNavegar} />
        ))}
      </div>
    </div>
  );
}

function SubLink({ sub, onNavegar }: { sub: SubItem; onNavegar: () => void }) {
  const pathname = usePathname();
  return (
    <Link href={sub.href} onClick={onNavegar} className="nav-sub" data-ativo={pathname === sub.href}>
      {sub.label}
    </Link>
  );
}

export default function Sidebar({ isAdmin, userEmail }: { isAdmin: boolean; userEmail: string; role: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const fecharDrawer = () => setAberto(false);

  return (
    <>
      {/* Header mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl h-14 flex items-center justify-between px-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <nav className="flex-1 px-3 py-4 flex flex-col overflow-y-auto">
          {SECOES.map((secao, i) => (
            <div key={secao.titulo ?? `secao-${i}`} className="flex flex-col gap-1">
              {secao.titulo && <span className="nav-secao">{secao.titulo}</span>}
              {secao.itens.map((item) =>
                item.sub
                  ? <NavGrupo key={item.href} item={item} onNavegar={fecharDrawer} />
                  : <NavItem key={item.href} item={item} onNavegar={fecharDrawer} />
              )}
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-brand-border flex flex-col gap-1">
            {CONTA.filter((item) => !item.adminOnly || isAdmin).map((item) => (
              <NavItem key={item.href} item={item} onNavegar={fecharDrawer} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-5 border-t border-brand-border flex flex-col gap-3">
          <p className="text-xs px-3 truncate" style={{ color: "#4b5563" }}>{userEmail}</p>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-left"
          >
            <span className="nav-icon"><Icon icon="tabler:logout" width={16} /></span>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
