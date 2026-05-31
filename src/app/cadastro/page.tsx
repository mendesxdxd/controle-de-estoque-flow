import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Icon } from "@iconify/react";
import FormularioCadastro from "./FormularioCadastro";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <LinkInvalido mensagem="Nenhum link de convite fornecido." />;
  }

  const admin = createAdminClient();
  const { data: convite } = await admin
    .from("convites")
    .select("id, usado")
    .eq("token", token)
    .single();

  if (!convite) {
    return <LinkInvalido mensagem="Link de convite invalido." />;
  }

  if (convite.usado) {
    return <LinkInvalido mensagem="Este link de convite ja foi utilizado." />;
  }

  return <FormularioCadastro token={token} />;
}

function LinkInvalido({ mensagem }: { mensagem: string }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative px-6">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-sm text-center">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
        <div className="bg-brand-card border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <img src="/favicon.svg" alt="FlowStock" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-white tracking-tight">FlowStock</h1>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Icon icon="tabler:alert-circle" width={20} style={{ color: "#ef4444" }} />
          </div>
          <p className="text-sm font-semibold text-white mb-2">Link invalido</p>
          <p className="text-sm text-brand-medium mb-6">{mensagem}</p>
          <Link href="/login" className="text-sm font-semibold hover:text-white transition-colors" style={{ color: "#6b7280" }}>
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
