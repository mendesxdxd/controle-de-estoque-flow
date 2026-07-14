"use client";

import { usePathname } from "next/navigation";

const rotas: { match: (p: string) => boolean; label: string; sub?: string }[] = [
  { match: (p) => p === "/dashboard",        label: "Dashboard",            sub: "Visão geral"         },
  { match: (p) => p === "/produtos",         label: "Produtos",             sub: "Catalogo de produtos" },
  { match: (p) => p.startsWith("/produtos/"),label: "Produtos",             sub: "Detalhes do produto"  },
  { match: (p) => p === "/estoque",          label: "Estoque",              sub: "Movimentações"       },
  { match: (p) => p === "/estoque/resumo",   label: "Estoque",              sub: "Resumo do dia"       },
  { match: (p) => p === "/estoque/produto",  label: "Estoque",              sub: "Produto no estoque"  },
  { match: (p) => p === "/estoque/nota",     label: "Ordens de Frete",      sub: "Relatório de OF"     },
  { match: (p) => p === "/ordens-frete",     label: "Ordens de Frete",      sub: "Saldo por produto"   },
  { match: (p) => p === "/categorias",       label: "Categorias",           sub: "Todas as categorias" },
  { match: (p) => p === "/relatorios",       label: "Relatórios",           sub: "Análise de dados"    },
  { match: (p) => p === "/perfil",           label: "Perfil",               sub: "Sua conta"           },
  { match: (p) => p === "/usuarios",         label: "Usuários",             sub: "Gerenciar usuários"  },
  { match: (p) => p === "/admin",            label: "Admin",                sub: "Administração"       },
  { match: (p) => p === "/onboarding",      label: "Configuração",         sub: "Primeiros passos"    },
];

type Props = { role: string };

const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
  admin:        { label: "Admin",        color: "#8B83FF", bg: "rgba(108,99,255,0.12)" },
  operador:     { label: "Operador",     color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  visualizador: { label: "Visualizador", color: "#9ca3af", bg: "rgba(156,163,175,0.10)" },
};

export default function TopBar({ role }: Props) {
  const pathname = usePathname();
  const rota = rotas.find((r) => r.match(pathname));
  const badge = roleBadge[role] ?? roleBadge.visualizador;

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8"
      style={{
        height: 52,
        background: "rgba(10,10,18,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a1a2e",
      }}
    >
      <div className="flex items-center gap-3">
        {rota ? (
          <>
            <span className="text-sm font-bold text-white">{rota.label}</span>
            {rota.sub && (
              <>
                <span style={{ color: "#252540", fontSize: 16 }}>/</span>
                <span className="text-sm font-medium" style={{ color: "#6b7280" }}>{rota.sub}</span>
              </>
            )}
          </>
        ) : null}
      </div>

      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ color: badge.color, background: badge.bg }}
      >
        {badge.label}
      </span>
    </div>
  );
}