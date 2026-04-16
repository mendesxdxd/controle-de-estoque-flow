import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { listarUsuarios } from "./actions";
import TabelaUsuarios from "./TabelaUsuarios";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const { usuarios } = await listarUsuarios();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Usuarios</h1>
        <p className="page-subtitle">
          {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} cadastrado{usuarios.length !== 1 ? "s" : ""}
        </p>
      </div>

      <TabelaUsuarios usuarios={usuarios} />
    </div>
  );
}
