import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listarTenants } from "./actions";
import BotaoExcluirTenant from "./BotaoExcluirTenant";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const { tenants } = await listarTenants();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">Gerenciamento de empresas</p>
        </div>
        <Link href="/admin/clientes/novo" className="btn-primary">
          Nova empresa
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="glass-panel py-16 text-center">
          <p className="text-sm text-zinc-400">Nenhuma empresa cadastrada.</p>
        </div>
      ) : (
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="table-header">
                <th className="table-th">Empresa</th>
                <th className="table-th-right">Capacidade</th>
                <th className="table-th">Criado em</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: any, i: number) => (
                <tr key={t.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                  <td className="py-3 px-4 font-medium text-white">{t.nome}</td>
                  <td className="py-3 px-4 text-right text-zinc-400 td-num">
                    {t.capacidade_armazem?.toLocaleString("pt-BR") ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-zinc-500">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right flex gap-2 justify-end">
                    <Link href={`/admin/clientes/${t.id}`} className="btn-secondary text-xs">
                      Gerenciar
                    </Link>
                    <BotaoExcluirTenant id={t.id} nome={t.nome} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
