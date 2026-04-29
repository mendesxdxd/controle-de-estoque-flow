import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listarTenants, listarConvites } from "./actions";
import BotaoExcluirTenant from "./BotaoExcluirTenant";
import BotaoGerarConvite from "./BotaoGerarConvite";
import BotaoExcluirConvite from "./BotaoExcluirConvite";

type Convite = { id: string; token: string; usado: boolean; criado_em: string };
type Tenant = { id: string; nome: string; capacidade_armazem?: number | null; created_at: string; ativo?: boolean };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const { tenants } = await listarTenants();
  const { convites } = await listarConvites();

  const pendentes = (convites as Convite[]).filter((c) => !c.usado);
  const usados = (convites as Convite[]).filter((c) => c.usado);

  return (
    <div className="flex flex-col gap-10">

      {/* Convites */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Convites</h2>
            <p className="text-xs text-brand-medium mt-0.5">Gere um link para uma empresa criar a propria conta</p>
          </div>
          <BotaoGerarConvite />
        </div>

        {pendentes.length === 0 ? (
          <p className="text-xs text-brand-medium py-4">Nenhum convite pendente.</p>
        ) : (
          <div className="glass-table overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Token</th>
                  <th className="table-th">Criado em</th>
                  <th className="table-th">Status</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {pendentes.map((c: Convite, i: number) => (
                  <tr key={c.id} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-3 px-4 font-mono text-xs text-brand-light">{c.token}</td>
                    <td className="py-3 px-4 text-brand-medium">
                      {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}
                      >
                        Pendente
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <BotaoExcluirConvite id={c.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {usados.length > 0 && (
          <details className="group">
            <summary className="text-xs text-brand-medium cursor-pointer select-none hover:text-white transition-colors">
              {usados.length} convite{usados.length !== 1 ? "s" : ""} utilizado{usados.length !== 1 ? "s" : ""}
            </summary>
            <div className="mt-2 glass-table overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {usados.map((c: Convite, i: number) => (
                    <tr key={c.id} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: "#374151" }}>{c.token}</td>
                      <td className="py-3 px-4 text-xs" style={{ color: "#374151" }}>
                        {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(156,163,175,0.08)", color: "#4b5563" }}
                        >
                          Utilizado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      {/* Empresas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Empresas</h2>
          <Link href="/admin/clientes/novo" className="btn-primary">
            Nova empresa
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div className="glass-panel py-16 text-center">
            <p className="text-sm text-brand-light">Nenhuma empresa cadastrada.</p>
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
                {(tenants as Tenant[]).map((t, i: number) => (
                  <tr key={t.id} className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-3 px-4 font-medium text-white">{t.nome}</td>
                    <td className="py-3 px-4 text-right text-brand-light td-num">
                      {t.capacidade_armazem?.toLocaleString("pt-BR") ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-brand-medium">
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
      </section>

    </div>
  );
}
