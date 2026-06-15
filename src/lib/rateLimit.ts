import { createAdminClient } from "@/lib/supabase/admin";

const JANELA_SEGUNDOS = 60;
const MAX_REQUESTS = 10;

export async function verificarRateLimit(ip: string, endpoint: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const agora = new Date();
    const inicioJanela = new Date(agora.getTime() - JANELA_SEGUNDOS * 1000);

    const { data: existing } = await admin
      .from("rate_limits")
      .select("requests, window_start")
      .eq("ip", ip)
      .eq("endpoint", endpoint)
      .single();

    if (!existing || new Date(existing.window_start) < inicioJanela) {
      await admin.from("rate_limits").upsert({
        ip,
        endpoint,
        requests: 1,
        window_start: agora.toISOString(),
      });
      return true;
    }

    if (existing.requests >= MAX_REQUESTS) return false;

    await admin.from("rate_limits")
      .update({ requests: existing.requests + 1 })
      .eq("ip", ip)
      .eq("endpoint", endpoint);

    const { data: updated } = await admin
      .from("rate_limits")
      .select("requests")
      .eq("ip", ip)
      .eq("endpoint", endpoint)
      .single();

    return (updated?.requests ?? 0) <= MAX_REQUESTS;
  } catch {
    return true;
  }
}