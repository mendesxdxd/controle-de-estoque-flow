"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@iconify/react";

export type ManifestoItem = {
  produto: string | null;
  nfProduto?: string | null;
  nfPalete?: string | null;
  quantidade: number;
  detalhe?: string | null;
};

type Props = {
  tipo: "entrada" | "saida";
  /** Numero que identifica o documento: OF de entrada ou OF de saida. */
  documento: string | null;
  transportadora?: string | null;
  observacao?: string | null;
  itens: ManifestoItem[];
  total: number;
  /** Unidade do total: a entrada e lancada em caixas, a saida em paletes. */
  unidade: "caixas" | "paletes";
  aviso?: string | null;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

// A data do registro e "agora", mas o fuso do servidor e o do navegador podem cair
// em dias diferentes. Resolver so no cliente evita divergencia na hidratacao.
const semInscricao = () => () => {};
const dataNoCliente = () => new Date().toLocaleDateString("pt-BR");
const dataNoServidor = () => "";

function Linha({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="manifesto-label shrink-0">{label}</span>
      <span className={`manifesto-value text-right truncate ${valor ? "" : "opacity-40"}`}>
        {valor || "—"}
      </span>
    </div>
  );
}

export default function Manifesto({
  tipo,
  documento,
  transportadora,
  observacao,
  itens,
  total,
  unidade,
  aviso,
}: Props) {
  const data = useSyncExternalStore(semInscricao, dataNoCliente, dataNoServidor);

  const entrada = tipo === "entrada";
  const preenchidos = itens.filter((i) => i.produto);

  return (
    <aside className="manifesto xl:sticky xl:top-4" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <span className="manifesto-label">Manifesto</span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            entrada
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          <Icon
            icon={entrada ? "tabler:arrow-down-circle" : "tabler:arrow-up-circle"}
            width={11}
            className="inline mr-1 -mt-px"
          />
          {entrada ? "Entrada" : "Saída"}
        </span>
      </div>

      <div className="manifesto-rule" />

      <div className="flex flex-col gap-2">
        <Linha label={entrada ? "OF" : "OF saída"} valor={documento} />
        <Linha label="Data" valor={data} />
        {entrada ? (
          <Linha label="Transp." valor={transportadora || null} />
        ) : (
          <Linha label="Obs." valor={observacao || null} />
        )}
      </div>

      <div className="manifesto-rule" />

      <div className="flex flex-col gap-2">
        <span className="manifesto-label">
          Itens {preenchidos.length > 0 && `(${preenchidos.length})`}
        </span>

        {preenchidos.length === 0 ? (
          <p className="text-xs text-brand-label">
            Nenhum item preenchido ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {preenchidos.map((item, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">
                    {item.produto}
                  </span>
                  <span className="manifesto-value shrink-0 tabular-nums">
                    {fmt(item.quantidade)}
                  </span>
                </div>
                {(item.nfProduto || item.nfPalete || item.detalhe) && (
                  <div className="flex flex-wrap gap-x-2 text-[10px]" style={{ color: "#8B83FF" }}>
                    {item.nfProduto && <span className="font-mono">NF {item.nfProduto}</span>}
                    {item.nfPalete && <span className="font-mono">PAL {item.nfPalete}</span>}
                    {item.detalhe && <span className="font-mono">{item.detalhe}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="manifesto-rule" />

      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="manifesto-label">Total</span>
          <span className="text-[10px] font-semibold" style={{ color: "#8B83FF" }}>
            em {unidade}
          </span>
        </div>
        <span className="manifesto-total">{fmt(total)}</span>
      </div>

      {aviso && (
        <div className="mov-aviso">
          <Icon icon="tabler:alert-triangle" width={14} className="shrink-0" />
          <span>{aviso}</span>
        </div>
      )}
    </aside>
  );
}
