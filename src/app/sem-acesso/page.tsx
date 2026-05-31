"use client";

import { Icon } from "@iconify/react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SemAcessoPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#080810" }}>
      <div className="glass-panel p-10 max-w-md w-full text-center flex flex-col gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <Icon icon="tabler:lock" width={20} style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Acesso negado</h1>
          <p className="text-sm text-brand-medium mt-1">
            Sua conta nao esta vinculada a nenhuma empresa. Voce precisa de um convite valido para acessar o sistema.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-primary text-sm"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
