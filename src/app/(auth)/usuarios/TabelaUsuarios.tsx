import Link from "next/link";

type Usuario = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  nome: string | null;
  tenant_id: string | null;
  tenant_nome: string | null;
};

type Props = {
  usuarios: Usuario[];
};

export default function TabelaUsuarios({ usuarios }: Props) {
  if (usuarios.length === 0) {
    return (
      <div className="glass-panel py-16 text-center">
        <p className="text-sm text-brand-medium">Nenhum usuario cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="glass-table overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="table-header">
            <th className="table-th">Nome</th>
            <th className="table-th">Email</th>
            <th className="table-th">Cliente</th>
            <th className="table-th">Ultimo acesso</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <tr
              key={u.id}
              className={`border-b border-brand-border/40 ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
            >
              <td className="py-3 px-4 font-medium text-white">{u.nome ?? "—"}</td>
              <td className="py-3 px-4 text-brand-light">{u.email ?? "—"}</td>
              <td className="py-3 px-4">
                {u.tenant_id ? (
                  <Link
                    href={`/admin/clientes/${u.tenant_id}`}
                    className="text-brand-primary hover:text-indigo-300 transition-colors"
                  >
                    {u.tenant_nome ?? "—"}
                  </Link>
                ) : (
                  <span className="text-brand-medium">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-brand-medium">
                {u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                  : "Nunca"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
