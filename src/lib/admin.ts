import { createClient } from "@/lib/supabase/server";

export async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user && user.email === process.env.ADMIN_EMAIL;
}

export async function verificarAdmin() {
  if (!(await isAdminUser())) throw new Error("Acesso negado.");
}
