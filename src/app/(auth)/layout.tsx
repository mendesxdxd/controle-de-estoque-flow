import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";

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
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Orbs de fundo globais */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-700/10 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/8 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      <Sidebar isAdmin={isAdmin} userEmail={userEmail} />
      <main className="flex-1 flex flex-col overflow-auto mt-14 lg:mt-0 relative z-10">
        <TopBar />
        <div className="flex-1 p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
