"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { OrdemFrete, NotaSaldo, NotaBaixa, Nota } from "@/types";
import { registrarSaidaNota, estornarSaida, excluirOF } from "./actions";

type Props = {
  ofsIniciais: OrdemFrete[];
  saldos: NotaSaldo[];
  baixas: NotaBaixa[];
  role: "admin" | "operador" | "visualizador";
};

type NotaEnriquecida = {
  nota: Nota;
  ofId: string;
  ofNumero: string;
  ofCreatedAt: string;
  cxp: number | null;
  inicialCx: number;
  baixadoCx: number;
  saldoCx: number;
  inicialPal: number;
  baixadoPal: number;
  saldoPal: number;
};

type Grupo = {
  key: string;
  nome: string;
  unidade: string;
  cxp: number | null;
  notas: NotaEnriquecida[];
  saldoPalTotal: number;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function paletesDe(caixas: number, cxp: number | null) {
  return cxp && cxp > 0 ? caixas / cxp : caixas;
}

export default function OrdensFrete({ ofsIniciais, saldos, baixas, role }: Props) {
  const router = useRouter();
  const podeEditar = role === "admin" || role === "operador";
  const podeExcluirOF = role === "admin";

  const [busca, setBusca] = useState("");
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(new Set());
  const [notasBaixasAbertas, setNotasBaixasAbertas] = useState<Set<string>>(new Set());
  const [saidaAlvo, setSaidaAlvo] = useState<NotaEnriquecida | null>(null);
  const [toast, setToast] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  const saldoPorNota = useMemo(() => {
    const m = new Map<string, NotaSaldo>();
    for (const s of saldos) m.set(s.nota_id, s);
    return m;
  }, [saldos]);

  const baixasPorNota = useMemo(() => {
    const m = new Map<string, NotaBaixa[]>();
    for (const b of baixas) {
      const arr = m.get(b.nota_id) ?? [];
      arr.push(b);
      m.set(b.nota_id, arr);
    }
    return m;
  }, [baixas]);

  const grupos = useMemo(() => {
    const map = new Map<string, Grupo>();
    for (const of of ofsIniciais) {
      for (const nota of of.notas ?? []) {
        // Modelo novo: apenas notas de produto (palete vem junto na nota do produto).
        if (nota.tipo !== "produto" || !nota.produto_id) continue;

        const cxp = nota.produtos?.caixas_por_palete ?? null;
        const s = saldoPorNota.get(nota.id);
        const inicialCx = Number(nota.quantidade_inicial);
        const baixadoCx = s ? Number(s.total_baixado) : 0;
        const saldoCx = s ? Number(s.saldo) : inicialCx;

        const key = nota.produto_id;
        const nome = nota.produtos?.nome ?? "Produto";
        const unidade = nota.produtos?.unidade ?? "cx";

        if (!map.has(key)) {
          map.set(key, { key, nome, unidade, cxp, notas: [], saldoPalTotal: 0 });
        }
        const grupo = map.get(key)!;
        const item: NotaEnriquecida = {
          nota,
          ofId: of.id,
          ofNumero: of.numero,
          ofCreatedAt: of.created_at,
          cxp,
          inicialCx,
          baixadoCx,
          saldoCx,
          inicialPal: paletesDe(inicialCx, cxp),
          baixadoPal: paletesDe(baixadoCx, cxp),
          saldoPal: paletesDe(saldoCx, cxp),
        };
        grupo.notas.push(item);
        grupo.saldoPalTotal += item.saldoPal;
      }
    }
    const arr = [...map.values()];
    for (const g of arr) g.notas.sort((a, b) => (a.ofCreatedAt < b.ofCreatedAt ? 1 : -1));
    arr.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return arr;
  }, [ofsIniciais, saldoPorNota]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return grupos;
    return grupos
      .map((g) => {
        if (g.nome.toLowerCase().includes(termo)) return g;
        const notas = g.notas.filter(
          (n) =>
            n.ofNumero.toLowerCase().includes(termo) ||
            (n.nota.numero ?? "").toLowerCase().includes(termo) ||
            (n.nota.nf_palete ?? "").toLowerCase().includes(termo)
        );
        return notas.length > 0 ? { ...g, notas } : null;
      })
      .filter((g): g is Grupo => g !== null);
  }, [grupos, busca]);

  function mostrarToast(tipo: "ok" | "erro", msg: string) {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleGrupo(key: string) {
    setGruposAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(key)) novo.delete(key);
      else novo.add(key);
      return novo;
    });
  }

  function toggleBaixas(notaId: string) {
    setNotasBaixasAbertas((prev) => {
      const novo = new Set(prev);
      if (novo.has(notaId)) novo.delete(notaId);
      else novo.add(notaId);
      return novo;
    });
  }

  async function handleEstornar(id: string) {
    if (!confirm("Estornar esta saída? A quantidade volta para o saldo da nota e sai do estoque.")) return;
    const r = await estornarSaida(id);
    if (r?.erro) mostrarToast("erro", r.erro);
    else { mostrarToast("ok", "Saída estornada."); router.refresh(); }
  }

  async function handleExcluirOF(ofId: string, ofNumero: string) {
    if (!confirm(`Excluir a OF ${ofNumero}? Remove todas as notas, saídas e as entradas/saídas de estoque ligadas. Não pode ser desfeito.`)) return;
    const r = await excluirOF(ofId);
    if (r?.erro) mostrarToast("erro", r.erro);
    else { mostrarToast("ok", `OF ${ofNumero} excluída.`); router.refresh(); }
  }

  const totalPaletes = gruposFiltrados.reduce((acc, g) => acc + g.saldoPalTotal, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Ordens de Frete</h1>
          <p className="page-subtitle">Paletes disponíveis por produto e por OF. Para dar entrada, use a tela de Estoque.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Icon icon="tabler:search" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input-field w-full pl-9"
          placeholder="Buscar por produto, OF ou nº da NF..."
        />
      </div>

      {gruposFiltrados.length === 0 ? (
        <div className="empty-state">
          <Icon icon="tabler:package-off" width={40} className="text-brand-muted" />
          <p className="empty-state-text">
            {busca ? "Nenhum produto encontrado para a busca." : "Nenhuma nota cadastrada. Registre uma entrada na tela de Estoque."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {gruposFiltrados.map((grupo) => {
            const aberto = gruposAbertos.has(grupo.key) || !!busca;
            const ofsComSaldo = grupo.notas.filter((n) => n.saldoPal > 0).length;
            return (
              <div key={grupo.key} className="glass-panel overflow-hidden">
                {/* Cabecalho do produto */}
                <button
                  onClick={() => toggleGrupo(grupo.key)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-brand-hover/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(108,99,255,0.12)" }}>
                      <Icon icon="tabler:package" width={20} className="text-brand-medium" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{grupo.nome}</p>
                      <p className="text-xs text-brand-muted">{grupo.notas.length} OF(s) • {ofsComSaldo} com saldo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-brand-muted">Paletes disponíveis</p>
                      <p className={`text-base font-bold td-num ${grupo.saldoPalTotal > 0 ? "text-emerald-400" : "text-brand-muted"}`}>{fmt(grupo.saldoPalTotal)}</p>
                    </div>
                    <Icon icon={aberto ? "tabler:chevron-up" : "tabler:chevron-down"} width={18} className="text-brand-muted" />
                  </div>
                </button>

                {aberto && (
                  <div className="glass-table border-t border-brand-border/60 overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="table-header">
                          <th className="table-th">OF</th>
                          <th className="table-th">NF produto</th>
                          <th className="table-th">NF palete</th>
                          <th className="table-th-right">Paletes recebidos</th>
                          <th className="table-th-right">Saída</th>
                          <th className="table-th-right">Disponível</th>
                          <th className="table-th-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.notas.map((item, i) => {
                          const listaBaixas = baixasPorNota.get(item.nota.id) ?? [];
                          const abertaBaixas = notasBaixasAbertas.has(item.nota.id);
                          const zerado = item.saldoPal <= 0;
                          return (
                            <Fragment key={item.nota.id}>
                              <tr className={i % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                                <td className="py-3 px-4 td-num text-brand-light">{item.ofNumero}</td>
                                <td className="py-3 px-4 td-num text-brand-light">{item.nota.numero || "—"}</td>
                                <td className="py-3 px-4 td-num text-brand-light">{item.nota.nf_palete || "—"}</td>
                                <td className="py-3 px-4 text-right td-num text-brand-light">{fmt(item.inicialPal)}</td>
                                <td className="py-3 px-4 text-right td-num text-brand-muted">{fmt(item.baixadoPal)}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className={zerado ? "badge-status-baixo" : "badge-status-ok"}>{fmt(item.saldoPal)}</span>
                                  {item.cxp ? <div className="text-[10px] text-brand-muted mt-0.5">{fmt(item.saldoCx)} cx</div> : null}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-3">
                                    {listaBaixas.length > 0 && (
                                      <button onClick={() => toggleBaixas(item.nota.id)} className="btn-action flex items-center gap-1">
                                        <Icon icon={abertaBaixas ? "tabler:chevron-up" : "tabler:history"} width={13} />
                                        {listaBaixas.length}
                                      </button>
                                    )}
                                    {podeEditar && !zerado && (
                                      <button onClick={() => setSaidaAlvo(item)} className="btn-action flex items-center gap-1">
                                        <Icon icon="tabler:arrow-up-circle" width={14} /> Saída
                                      </button>
                                    )}
                                    {podeExcluirOF && (
                                      <button
                                        onClick={() => handleExcluirOF(item.ofId, item.ofNumero)}
                                        className="text-brand-muted hover:text-red-400 transition-colors"
                                        title={`Excluir OF ${item.ofNumero}`}
                                      >
                                        <Icon icon="tabler:trash" width={14} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {abertaBaixas && (
                                <tr>
                                  <td colSpan={7} className="px-4 pb-3" style={{ background: "rgba(26,26,46,0.25)" }}>
                                    <div className="flex flex-col gap-1.5 py-2">
                                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">Histórico de saídas</p>
                                      {listaBaixas.map((b) => (
                                        <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b border-brand-border/40 last:border-0">
                                          <span className="text-brand-light">
                                            <span className="td-num font-semibold text-white">-{fmt(paletesDe(Number(b.quantidade), item.cxp))} pal</span>
                                            <span className="text-brand-muted"> • {fmtData(b.created_at)}</span>
                                            {b.observacao ? <span className="text-brand-muted"> • {b.observacao}</span> : ""}
                                          </span>
                                          {podeEditar && (
                                            <button onClick={() => handleEstornar(b.id)} className="btn-danger">Estornar</button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pr-2">
            <p className="text-sm text-brand-muted">
              Total disponível: <span className="text-emerald-400 font-bold td-num">{fmt(totalPaletes)}</span> paletes
            </p>
          </div>
        </div>
      )}

      {saidaAlvo && (
        <ModalSaida
          item={saidaAlvo}
          onFechar={() => setSaidaAlvo(null)}
          onSucesso={(msg) => { setSaidaAlvo(null); mostrarToast("ok", msg); router.refresh(); }}
          onErro={(msg) => mostrarToast("erro", msg)}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2"
          style={
            toast.tipo === "ok"
              ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7" }
              : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }
          }
        >
          <Icon icon={toast.tipo === "ok" ? "tabler:circle-check" : "tabler:alert-circle"} width={16} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ModalSaida({
  item,
  onFechar,
  onSucesso,
  onErro,
}: {
  item: NotaEnriquecida;
  onFechar: () => void;
  onSucesso: (msg: string) => void;
  onErro: (msg: string) => void;
}) {
  const [paletes, setPaletes] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const cxp = item.cxp;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErro("");
    const qtdPal = Number(paletes);
    if (!qtdPal || qtdPal <= 0) { setErro("Informe uma quantidade maior que zero."); return; }
    if (qtdPal > item.saldoPal + 1e-9) { setErro(`Saldo insuficiente. Disponível: ${fmt(item.saldoPal)} paletes.`); return; }

    const qtdCaixas = cxp && cxp > 0 ? qtdPal * cxp : qtdPal;

    setSalvando(true);
    try {
      const r = await registrarSaidaNota({ nota_id: item.nota.id, quantidade: qtdCaixas, observacao: observacao.trim() || null });
      if (r?.erro) { setErro(r.erro); onErro(r.erro); return; }
      onSucesso(`Saída de ${fmt(qtdPal)} palete(s) registrada.`);
    } finally {
      setSalvando(false);
    }
  }

  const nome = item.nota.produtos?.nome ?? "Produto";
  const qtdPalNum = Number(paletes) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onFechar}>
      <div className="glass-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Registrar saída</h2>
          <button onClick={onFechar} className="text-brand-muted hover:text-white transition-colors">
            <Icon icon="tabler:x" width={18} />
          </button>
        </div>
        <p className="text-xs text-brand-muted mb-4">
          {nome} • OF {item.ofNumero} • NF {item.nota.numero || "s/n"} • Disponível:{" "}
          <span className="text-emerald-400 font-semibold td-num">{fmt(item.saldoPal)}</span> paletes
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">Quantidade (paletes)</label>
            <input type="number" min="0" step="any" autoFocus value={paletes} onChange={(e) => setPaletes(e.target.value)} className="input-field" placeholder="0" />
            {cxp && qtdPalNum > 0 && (
              <span className="text-[10px] text-brand-primary">= {fmt(qtdPalNum * cxp)} caixas</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-brand-light">
              Observação <span className="text-brand-medium normal-case font-normal">(opcional)</span>
            </label>
            <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} className="input-field" placeholder="Ex: Carregamento caminhão placa ABC-1234" />
          </div>

          {erro && (
            <p className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={salvando} className="btn-primary flex-1">
              {salvando ? "Registrando..." : "Confirmar saída"}
            </button>
            <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
