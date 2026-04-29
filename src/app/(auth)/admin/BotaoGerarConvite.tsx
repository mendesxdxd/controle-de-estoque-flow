"use client";

import { useState } from "react";
import { gerarConvite } from "./actions";

export default function BotaoGerarConvite() {
  const [link, setLink] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [gerando, setGerando] = useState(false);

  async function handleGerar() {
    setGerando(true);
    const resultado = await gerarConvite();
    setGerando(false);
    if (resultado?.token) {
      const url = `${window.location.origin}/cadastro?token=${resultado.token}`;
      setLink(url);
      setCopiado(false);
    }
  }

  async function handleCopiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleGerar}
        disabled={gerando}
        className="btn-primary disabled:opacity-50"
      >
        {gerando ? "Gerando..." : "Gerar convite"}
      </button>

      {link && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)" }}
        >
          <span className="text-xs text-brand-light flex-1 truncate font-mono">{link}</span>
          <button
            onClick={handleCopiar}
            className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-150"
            style={{
              background: copiado ? "rgba(52,211,153,0.15)" : "rgba(108,99,255,0.15)",
              color: copiado ? "#34d399" : "#8B83FF",
            }}
          >
            {copiado ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}
