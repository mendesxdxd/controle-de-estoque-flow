import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listarUsuariosTenant, listarUsuariosSemTenant, excluirUsuarioTenant, atualizarPermissao, excluirTenant } from "../../actions";
import BotoesUsuario from "./BotoesUsuario";
import FormularioEditarTenant from "./FormularioEditarTenant";
import VincularUsuario from "./VincularUsuario";

export default async function DetalheClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("*").eq("id", id).single();
  if (!tenant) redirect("/admin");

  const { usuarios } = await listarUsuariosTenant(id);
  const { usuarios: semTenant } = await listarUsuariosSemTenant();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-zinc-500 hover:text-white transition-colors text-sm">Admin</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-white">{tenant.nome}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">{tenant.nome}</h1>
          <p className="page-subtitle">
            Capacidade: {tenant.capacidade_armazem?.toLocaleString("pt-BR") ?? "—"} paletes
          </p>
        </div>
        <div className="flex gap-2 items-start flex-wrap justify-end">
          <FormularioEditarTenant
            id={id}
            nomeInicial={tenant.nome}
            capacidadeInicial={tenant.capacidade_armazem ?? null}
          />
          <VincularUsuario tenantId={id} usuariosSemTenant={semTenant} />
          <Link href={`/admin/clientes/${id}/usuarios/novo`} className="btn-primary">
            Novo usuario
          </Link>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-700 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Usuarios</h2>
          <span className="text-xs text-zinc-500">{usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}</span>
        </div>

        {usuarios.length === 0 ? (
          <div className="glass-panel py-16 text-center">
            <p className="text-sm text-zinc-400">Nenhum usuario vinculado.</p>
          </div>
        ) : (
          <div className="glass-table overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="table-th">Nome</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Ultimo acesso</th>
                  <th className="table-th">Fechamento</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u: any, i: number) => (
                  <tr key={u.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}>
                    <td className="py-3 px-4 font-medium text-white">{u.nome ?? "—"}</td>
                    <td className="py-3 px-4 text-zinc-400">{u.email ?? "—"}</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        u.pode_fechamento ? "bg-indigo-500/15 text-indigo-400" : "bg-zinc-700/50 text-zinc-400"
                      }`}>
                        {u.pode_fechamento ? "Liberado" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <BotoesUsuario
                        userId={u.id}
                        tenantId={id}
                        podeFechamento={u.pode_fechamento}
                        atualizarPermissao={atualizarPermissao}
                        excluirUsuario={excluirUsuarioTenant}
                      />
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
