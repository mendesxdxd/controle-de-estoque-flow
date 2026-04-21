type Usuario = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  nome: string | null;
  pode_fechamento: boolean;
  tenant_nome: string | null;
};

type Props = {
  usuarios: Usuario[];
};

export default function TabelaUsuarios({ usuarios }: Props) {
  if (usuarios.length === 0) {
    return (
      <div className="glass-panel py-16 text-center">
        <p className="text-sm text-zinc-500">Nenhum usuario cadastrado.</p>
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
            <th className="table-th">Fechamento</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, i) => (
            <tr
              key={u.id}
              className={`border-b border-white/[0.04] ${i % 2 === 0 ? "table-row-even" : "table-row-odd"}`}
            >
              <td className="py-3 px-4 font-medium text-white">{u.nome ?? "—"}</td>
              <td className="py-3 px-4 text-zinc-400">{u.email ?? "—"}</td>
              <td className="py-3 px-4 text-zinc-400">{u.tenant_nome ?? "—"}</td>
              <td className="py-3 px-4 text-zinc-500">
                {u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                  : "Nunca"}
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  u.pode_fechamento
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "bg-zinc-700/50 text-zinc-400"
                }`}>
                  {u.pode_fechamento ? "Liberado" : "Bloqueado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
