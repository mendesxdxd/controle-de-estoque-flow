"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Produto, OrdemFrete, NotaSaldo } from "@/types";
import FormularioEntrada from "./FormularioEntrada";
import FormularioSaida from "./FormularioSaida";

export type Modo = "entrada" | "saida";

type Props = {
  modo: Modo;
  onModoChange: (modo: Modo) => void;
  produtos: Produto[];
  ofs: OrdemFrete[];
  saldos: NotaSaldo[];
  notaObrigatoria: boolean;
  onSucesso: (mensagem: string) => void;
};

const OPCOES: { tipo: Modo; label: string; icone: string }[] = [
  { tipo: "entrada", label: "Entrada", icone: "tabler:arrow-down-circle" },
  { tipo: "saida", label: "Saída", icone: "tabler:arrow-up-circle" },
];

export default function PainelMovimentacao({
  modo,
  onModoChange,
  produtos,
  ofs,
  saldos,
  notaObrigatoria,
  onSucesso,
}: Props) {
  // Remontar o formulario descarta o estado preenchido, como acontecia quando o
  // painel era fechado. E o que `onFechar` faz agora que o painel fica sempre aberto.
  const [resetKey, setResetKey] = useState(0);
  const limpar = () => setResetKey((k) => k + 1);

  return (
    <section className="mov-panel romaneio" data-modo={modo}>
      <div className="mov-panel-header">
        <div className="flex items-center gap-3">
          <h2 className="mov-panel-title">Registrar movimentação</h2>
        </div>

        <div className="seg" role="group" aria-label="Tipo de movimentação">
          {OPCOES.map(({ tipo, label, icone }) => (
            <button
              key={tipo}
              type="button"
              data-tipo={tipo}
              aria-pressed={modo === tipo}
              onClick={() => onModoChange(tipo)}
              className="seg-btn"
            >
              <span className="seg-dot" aria-hidden="true" />
              <Icon icon={icone} width={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {modo === "entrada" ? (
          <FormularioEntrada
            key={`entrada-${resetKey}`}
            produtos={produtos}
            notaObrigatoria={notaObrigatoria}
            onFechar={limpar}
            onSucesso={() => onSucesso("Entrada registrada.")}
          />
        ) : (
          <FormularioSaida
            key={`saida-${resetKey}`}
            ofs={ofs}
            saldos={saldos}
            onFechar={limpar}
            onSucesso={() => onSucesso("Saída registrada.")}
          />
        )}
      </div>
    </section>
  );
}
