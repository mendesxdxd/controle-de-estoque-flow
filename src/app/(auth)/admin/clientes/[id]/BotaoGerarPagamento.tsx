"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function BotaoGerarPagamento({ tenantId }: { tenantId: string }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  async function handleGerar() {
    setErro("");
    setCarregando(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    const data = await res.json();
    setCarregando(false);
    if (data.erro) {
      setErro(data.erro);
      return;
    }
    await navigator.clipboard.writeText(data.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button onClick={handleGerar} disabled={carregando} className="btn-secondary text-xs">
          {carregando ? "Gerando..." : "Gerar link de pagamento"}
        </button>
        {erro && <p className="text-xs text-red-400">{erro}</p>}
      </div>

      {typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "rgba(108,99,255,0.15)",
              border: "1px solid rgba(108,99,255,0.4)",
              color: "#a89aff",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              backdropFilter: "blur(8px)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
              opacity: copiado ? 1 : 0,
              transform: copiado ? "translateY(0px)" : "translateY(6px)",
            }}
          >
            Link copiado!
          </div>
        </div>,
        document.body
      )}
    </>
  );
}