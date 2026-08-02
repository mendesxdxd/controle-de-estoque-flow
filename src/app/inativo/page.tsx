import { Icon } from "@iconify/react";

export default function InativoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#080810" }}>
      <div className="glass-panel p-10 max-w-md w-full text-center flex flex-col gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.12)" }}
        >
          <Icon icon="tabler:alert-circle" width={20} style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Conta inativa</h1>
          <p className="text-sm text-brand-medium mt-1">
            O acesso da sua empresa foi suspenso. Entre em contato para regularizar a situação.
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