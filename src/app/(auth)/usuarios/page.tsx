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
      <TabelaUsuarios usuarios={usuarios} />
    </div>
  );
}
