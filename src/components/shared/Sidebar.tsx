"use client";

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-black flex flex-col">
      <div className="px-6 py-8 border-b border-neutral-800">
        <span className="text-white text-sm font-bold tracking-tight uppercase">
          Controle do CHIP
        </span>
      </div>

      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {links.map((link) => {
          const ativo = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                ativo
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-6 border-t border-neutral-800">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-100 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none transition-all duration-150 text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
