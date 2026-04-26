"use client";

import { usePathname } from "next/navigation";

const rotas: { match: (p: string) => boolean; label: string; sub?: string }[] = [
  { match: (p) => p === "/dashboard",        label: "Dashboard",            sub: "Visao geral"         },
  { match: (p) => p === "/produtos",         label: "Produtos",             sub: "Catalogo de produtos" },
  { match: (p) => p.startsWith("/produtos/"),label: "Produtos",             sub: "Detalhes do produto"  },
  { match: (p) => p === "/estoque",          label: "Estoque",              sub: "Movimentacoes"       },
  { match: (p) => p === "/estoque/resumo",   label: "Estoque",              sub: "Resumo do dia"       },
  { match: (p) => p === "/estoque/produto",  label: "Estoque",              sub: "Produto no estoque"  },
  { match: (p) => p === "/estoque/nota",     label: "Estoque",              sub: "Ordem de Frete"      },
  { match: (p) => p === "/categorias",       label: "Categorias",           sub: "Todas as categorias" },
  { match: (p) => p === "/relatorios",       label: "Relatorios",           sub: "Analise de dados"    },
  { match: (p) => p === "/perfil",           label: "Perfil",               sub: "Sua conta"           },
  { match: (p) => p === "/usuarios",         label: "Usuarios",             sub: "Gerenciar usuarios"  },
  { match: (p) => p === "/admin",            label: "Admin",                sub: "Administracao"       },
];

export default function TopBar() {
  const pathname = usePathname();
  const rota = rotas.find((r) => r.match(pathname));

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-6 lg:px-8"
      style={{
        height: 52,
        background: "rgba(10,10,18,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a1a2e",
      }}
    >
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
  );
}