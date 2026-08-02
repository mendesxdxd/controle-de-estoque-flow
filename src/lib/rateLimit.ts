import { createAdminClient } from "@/lib/supabase/admin";

const JANELA_SEGUNDOS = 60;
const MAX_REQUESTS = 10;

export async function verificarRateLimit(ip: string, endpoint: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_ip: ip,
      p_endpoint: endpoint,
      p_max: MAX_REQUESTS,
      p_window_seconds: JANELA_SEGUNDOS,
    });

    // Falha fechada: qualquer erro nega o pedido (o cadastro e por convite e
    // de baixo volume, entao bloquear em caso de erro e mais seguro do que
    // liberar). Nao pode virar bypass do limite.
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
