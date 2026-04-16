import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.email === process.env.ADMIN_EMAIL;
  const userEmail = user.email ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar isAdmin={isAdmin} userEmail={userEmail} />
      <main className="flex-1 p-4 lg:p-8 overflow-auto mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
