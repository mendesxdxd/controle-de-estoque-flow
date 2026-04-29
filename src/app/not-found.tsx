import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative px-6">

      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-700/25 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-900/20 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="relative w-full max-w-sm">

        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent rounded-t-2xl" />

        <div className="bg-brand-card backdrop-blur-2xl border border-brand-border rounded-2xl p-10 shadow-2xl shadow-black/60 flex flex-col items-center gap-8 text-center">

          {/* Logo */}
          <div className="flex items-center gap-3 self-start">
            <img src="/favicon.svg" alt="FlowStock" className="w-8 h-8" />
            <span className="text-xl font-bold text-white tracking-tight">FlowStock</span>
          </div>

          {/* Icone 404 */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(108,99,255,0.1)",
                border: "1px solid rgba(108,99,255,0.2)",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B83FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-6xl font-black text-white tracking-tight">404</span>
              <p className="text-sm font-medium" style={{ color: "#6b7280" }}>
                Esta pagina nao existe ou foi removida.
              </p>
            </div>
          </div>

          {/* Botao */}
          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition-all duration-150 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #8B83FF, #6C63FF)",
              boxShadow: "0 4px 14px rgba(108,99,255,0.3)",
            }}
          >
            Voltar ao Dashboard
          </Link>

        </div>
      </div>
    </div>
  );
}
