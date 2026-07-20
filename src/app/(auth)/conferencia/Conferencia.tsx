"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { OrdemFrete, Produto } from "@/types";
import { estornarCarregamento, estornarSaida, excluirOF } from "@/app/(auth)/ordens-frete/actions";
import Toast from "@/components/shared/Toast";

/** Baixa com a nota, o produto e a OF de origem embutidos. */
export type BaixaDetalhada = {
  id: string;
  nota_id: string;
  quantidade: number;
  observacao: string | null;
  of_saida: string | null;
  created_at: string;
  notas?: {
    id: string;
    numero: string | null;
    nf_palete: string | null;
    produto_id: string | null;
    produtos?: Produto | null;
    ofs?: { numero: string } | null;
  } | null;
};

type Props = {
  ofs: OrdemFrete[];
  baixas: BaixaDetalhada[];
  role: "admin" | "operador" | "visualizador";
};

type Carregamento = {
  chave: string;
  ofSaida: string | null;
  createdAt: string;
  observacao: string | null;
  itens: BaixaDetalhada[];
  totalPal: number;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function paletesDe(caixas: number, cxp: number | null | undefined) {
  return cxp && cxp > 0 ? caixas / cxp : caixas;
}

export default function Conferencia({ ofs, baixas, role }: Props) {
  const router = useRouter();
  const podeEstornar = role === "admin" || role === "operador";
  const podeExcluirEntrada = role === "admin";

  const [aba, setAba] = useState<"saidas" | "entradas">("saidas");
  const [busca, setBusca] = useState("");
  const [processando, setProcessando] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Notas que ja tiveram saida: a entrada delas nao pode ser excluida direto. */
  const notasComBaixa = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of baixas) m.set(b.nota_id, (m.get(b.nota_id) ?? 0) + 1);
    return m;
  }, [baixas]);

  // Um carregamento e o conjunto de baixas que compartilham a mesma OF de saida.
  const carregamentos = useMemo(() => {
    const mapa = new Map<string, Carregamento>();
    for (const b of baixas) {
      // Baixas anteriores ao campo nao tem OF de saida: cada uma vira seu proprio
      // grupo, para nunca juntar carregamentos distintos sob uma chave vazia.
      const chave = b.of_saida ?? `__sem_of__${b.id}`;
      let grupo = mapa.get(chave);
      if (!grupo) {
        grupo = {
          chave,
          ofSaida: b.of_saida,
          createdAt: b.created_at,
          observacao: b.observacao,
          itens: [],
          totalPal: 0,
        };
        mapa.set(chave, grupo);
      }
      grupo.itens.push(b);
      grupo.totalPal += paletesDe(Number(b.quantidade), b.notas?.produtos?.caixas_por_palete);
      if (b.created_at > grupo.createdAt) grupo.createdAt = b.created_at;
    }
    return [...mapa.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [baixas]);

  const carregamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return carregamentos;
    return carregamentos.filter(
      (c) =>
        (c.ofSaida ?? "").toLowerCase().includes(termo) ||
        c.itens.some(
          (i) =>
            (i.notas?.produtos?.nome ?? "").toLowerCase().includes(termo) ||
            (i.notas?.ofs?.numero ?? "").toLowerCase().includes(termo) ||
            (i.notas?.numero ?? "").toLowerCase().includes(termo)
        )
    );
  }, [carregamentos, busca]);

  const entradasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ofs;
    return ofs.filter(
      (of) =>
        of.numero.toLowerCase().includes(termo) ||
        (of.notas ?? []).some(
          (n) =>
            (n.produtos?.nome ?? "").toLowerCase().includes(termo) ||
            (n.numero ?? "").toLowerCase().includes(termo)
        )
    );
  }, [ofs, busca]);

  async function handleEstornarCarregamento(c: Carregamento) {
    if (!c.ofSaida) return;
    if (!confirm(
      `Estornar o carregamento da OF ${c.ofSaida}?\n\n` +
      `${c.itens.length} saída(s), ${fmt(c.totalPal)} paletes voltam para o saldo das notas.`
    )) return;

    setProcessando(c.chave);
    const r = await estornarCarregamento(c.ofSaida);
    setProcessando(null);
    if (r?.erro) setToast(r.erro);
    else { setToast(`Carregamento estornado (${r?.estornadas ?? 0} saídas).`); router.refresh(); }
  }

  async function handleEstornarItem(b: BaixaDetalhada) {
    const pal = paletesDe(Number(b.quantidade), b.notas?.produtos?.caixas_por_palete);
    if (!confirm(`Estornar esta saída?\n\n${fmt(pal)} paletes voltam para o saldo da nota.`)) return;

    setProcessando(b.id);
    const r = await estornarSaida(b.id);
    setProcessando(null);
    if (r?.erro) setToast(r.erro);
    else { setToast("Saída estornada."); router.refresh(); }
  }

  async function handleExcluirEntrada(of: OrdemFrete) {
    if (!confirm(
      `Excluir a entrada da OF ${of.numero}?\n\n` +
      `Remove as notas dela e as entradas de estoque. Não pode ser desfeito.`
    )) return;

    setProcessando(of.id);
    const r = await excluirOF(of.id);
    setProcessando(null);
    if (r?.erro) setToast(r.erro);
    else { setToast(`Entrada da OF ${of.numero} excluída.`); router.refresh(); }
  }

  return (
    <div className="flex flex-col gap-6 romaneio">
      <div>
        <h1 className="page-title">Conferência</h1>
        <p className="page-subtitle">
          Revise os carregamentos e as entradas registradas. Use para corrigir lançamentos errados.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label="Tipo de registro">
          <button
            type="button"
            data-tipo="saida"
            aria-pressed={aba === "saidas"}
            onClick={() => setAba("saidas")}
            className="seg-btn"
          >
            <span className="seg-dot" aria-hidden="true" />
            Saídas ({carregamentos.length})
          </button>
          <button
            type="button"
            data-tipo="entrada"
            aria-pressed={aba === "entradas"}
            onClick={() => setAba("entradas")}
            className="seg-btn"
          >
            <span className="seg-dot" aria-hidden="true" />
            Entradas ({ofs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Icon icon="tabler:search" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-field w-full pl-9"
            placeholder="Buscar por OF, produto ou NF..."
          />
        </div>
      </div>

      {/* ---------------- Saídas ---------------- */}
      {aba === "saidas" && (
        carregamentosFiltrados.length === 0 ? (
          <div className="empty-state">
            <Icon icon="tabler:truck-off" width={36} className="text-brand-muted" />
            <p className="empty-state-text">
              {busca ? "Nenhum carregamento encontrado." : "Nenhuma saída registrada ainda."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {carregamentosFiltrados.map((c) => (
              <div key={c.chave} className="mov-panel" data-modo="saida">
                <div className="mov-panel-header">
                  <div className="flex flex-col gap-0.5">
                    <span className="rom-doc-tipo">OF de saída</span>
                    <span className="rom-doc-id">{c.ofSaida ?? "sem OF"}</span>
                    <span className="text-xs text-brand-muted">
                      {fmtData(c.createdAt)}
                      {c.observacao ? ` • ${c.observacao}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="mov-col-label">Total</p>
                      <p className="text-lg font-bold td-num text-red-400">{fmt(c.totalPal)} pal</p>
                    </div>
                    {podeEstornar && c.ofSaida && c.itens.length > 1 && (
                      <button
                        onClick={() => handleEstornarCarregamento(c)}
                        disabled={processando === c.chave}
                        className="btn-secondary text-xs disabled:opacity-50"
                      >
                        {processando === c.chave ? "Estornando..." : "Estornar tudo"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="rom-tabela w-full min-w-[560px]">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>Item</th>
                        <th>Produto</th>
                        <th style={{ width: 120 }}>OF origem</th>
                        <th style={{ width: 90 }}>NF</th>
                        <th style={{ width: 90 }} className="text-right">Paletes</th>
                        <th style={{ width: 90 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {c.itens.map((b, i) => (
                        <tr key={b.id}>
                          <td><span className="rom-num">{String(i + 1).padStart(2, "0")}</span></td>
                          <td className="text-sm text-white">{b.notas?.produtos?.nome ?? "—"}</td>
                          <td className="td-num text-brand-light text-xs">{b.notas?.ofs?.numero ?? "—"}</td>
                          <td className="td-num text-brand-light text-xs">{b.notas?.numero ?? "—"}</td>
                          <td className="td-num text-right text-white text-sm">
                            {fmt(paletesDe(Number(b.quantidade), b.notas?.produtos?.caixas_por_palete))}
                          </td>
                          <td className="text-right">
                            {podeEstornar && (
                              <button
                                onClick={() => handleEstornarItem(b)}
                                disabled={processando === b.id}
                                className="btn-danger"
                              >
                                {processando === b.id ? "..." : "Estornar"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ---------------- Entradas ---------------- */}
      {aba === "entradas" && (
        entradasFiltradas.length === 0 ? (
          <div className="empty-state">
            <Icon icon="tabler:package-off" width={36} className="text-brand-muted" />
            <p className="empty-state-text">
              {busca ? "Nenhuma entrada encontrada." : "Nenhuma entrada registrada ainda."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entradasFiltradas.map((of) => {
              const notas = of.notas ?? [];
              const saidasNaOf = notas.reduce((soma, n) => soma + (notasComBaixa.get(n.id) ?? 0), 0);
              const travada = saidasNaOf > 0;

              return (
                <div key={of.id} className="mov-panel" data-modo="entrada">
                  <div className="mov-panel-header">
                    <div className="flex flex-col gap-0.5">
                      <span className="rom-doc-tipo">OF de entrada</span>
                      <span className="rom-doc-id">{of.numero}</span>
                      <span className="text-xs text-brand-muted">{fmtData(of.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {travada && (
                        <span className="text-[11px] text-brand-muted flex items-center gap-1.5 max-w-[220px]">
                          <Icon icon="tabler:lock" width={13} className="shrink-0" />
                          {saidasNaOf} saída(s) usam esta entrada. Estorne-as antes de excluir.
                        </span>
                      )}
                      {podeExcluirEntrada && (
                        <button
                          onClick={() => handleExcluirEntrada(of)}
                          disabled={travada || processando === of.id}
                          className="btn-danger disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {processando === of.id ? "Excluindo..." : "Excluir entrada"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="rom-tabela w-full min-w-[520px]">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>Item</th>
                          <th>Produto</th>
                          <th style={{ width: 100 }}>NF prod.</th>
                          <th style={{ width: 100 }}>NF palete</th>
                          <th style={{ width: 110 }} className="text-right">Recebido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notas.map((n, i) => {
                          const cxp = n.produtos?.caixas_por_palete ?? null;
                          return (
                            <tr key={n.id}>
                              <td><span className="rom-num">{String(i + 1).padStart(2, "0")}</span></td>
                              <td className="text-sm text-white">{n.produtos?.nome ?? "—"}</td>
                              <td className="td-num text-brand-light text-xs">{n.numero ?? "—"}</td>
                              <td className="td-num text-brand-light text-xs">{n.nf_palete ?? "—"}</td>
                              <td className="td-num text-right text-white text-sm">
                                {fmt(paletesDe(Number(n.quantidade_inicial), cxp))} pal
                                <span className="block text-[10px] text-brand-muted">
                                  {fmt(Number(n.quantidade_inicial))} cx
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
