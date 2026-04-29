export default function InativoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#080810" }}>
      <div className="glass-panel p-10 max-w-md w-full text-center flex flex-col gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.12)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Conta inativa</h1>
          <p className="text-sm text-brand-medium mt-1">
            O acesso da sua empresa foi suspenso. Entre em contato para regularizar o pagamento.
          </p>
        </div>
        <a
          href="mailto:suporte@flowestoque.com.br"
          className="btn-primary text-sm"
        >
          Entrar em contato
        </a>
      </div>
    </div>
  );
}