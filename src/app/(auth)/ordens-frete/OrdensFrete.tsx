"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { OrdemFrete, NotaSaldo, Nota } from "@/types";
import { editarValorNota } from "./actions";

type Props = {
  ofsIniciais: OrdemFrete[];
  saldos: NotaSaldo[];
  podeEditar?: boolean;
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
  valorUnitario: number;
  valorSaldo: number;
};

type Grupo = {
  key: string;
  nome: string;
  unidade: string;
  cxp: number | null;
  notas: NotaEnriquecida[];
  saldoPalTotal: number;
  valorSaldoTotal: number;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function fmtMoeda(n: number) {
  return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paletesDe(caixas: number, cxp: number | null) {
  return cxp && cxp > 0 ? caixas / cxp : caixas;
}

/**
 * Tela de consulta: saldo disponivel por produto e por OF.
 * Saida fica em Estoque e correcoes de lancamento em Conferencia.
 * Admin pode ajustar o valor unitario (R$/cx) de cada nota aqui.
 */
export default function OrdensFrete({ ofsIniciais, saldos, podeEditar = false }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"saldo" | "todos">("saldo");
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<string | null>(null);
  const [valorInput, setValorInput] = useState("");
  const [salvandoValor, setSalvandoValor] = useState(false);
  const [erroValor, setErroValor] = useState("");

  function abrirEdicao(notaId: string, valorAtual: number) {
    setEditando(notaId);
    setValorInput(valorAtual > 0 ? String(valorAtual) : "");
    setErroValor("");
  }

  async function salvarValor(notaId: string) {
    const valor = parseFloat(valorInput);
    if (!(valor >= 0)) {
      setErroValor("Informe um valor válido.");
      return;
    }
    setSalvandoValor(true);
    setErroValor("");
    const resultado = await editarValorNota({ nota_id: notaId, valor_unitario: valor });
    setSalvandoValor(false);
    if (resultado?.erro) {
      setErroValor(resultado.erro);
      return;
    }
    setEditando(null);
    router.refresh();
  }

  const saldoPorNota = useMemo(() => {
    const m = new Map<string, NotaSaldo>();
    for (const s of saldos) m.set(s.nota_id, s);
    return m;
  }, [saldos]);

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
        const valorUnitario = Number(nota.valor_unitario ?? 0);

        const key = nota.produto_id;
        const nome = nota.produtos?.nome ?? "Produto";
        const unidade = nota.produtos?.unidade ?? "cx";

        if (!map.has(key)) {
          map.set(key, { key, nome, unidade, cxp, notas: [], saldoPalTotal: 0, valorSaldoTotal: 0 });
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
          valorUnitario,
          valorSaldo: saldoCx * valorUnitario,
        };
        grupo.notas.push(item);
        grupo.saldoPalTotal += item.saldoPal;
        grupo.valorSaldoTotal += item.valorSaldo;
      }
    }
    const arr = [...map.values()];
    for (const g of arr) g.notas.sort((a, b) => (a.ofCreatedAt < b.ofCreatedAt ? 1 : -1));
    arr.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return arr;
  }, [ofsIniciais, saldoPorNota]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return grupos
      .filter((g) => (filtro === "saldo" ? g.saldoPalTotal > 0 : true))
      .map((g) => {
        if (!termo) return g;
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
  }, [grupos, busca, filtro]);

  // Estatisticas do topo, sempre sobre o conjunto inteiro (nao sobre o filtro).
  const totalPaletes = grupos.reduce((acc, g) => acc + g.saldoPalTotal, 0);
  const produtosComSaldo = grupos.filter((g) => g.saldoPalTotal > 0).length;
  const ofsAtivas = new Set(
    grupos.flatMap((g) => g.notas.filter((n) => n.saldoPal > 0).map((n) => n.ofId))
  ).size;

  function toggleGrupo(key: string) {
    setGruposAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(key)) novo.delete(key);
      else novo.add(key);
      return novo;
    });
  }

  return (
    <div className="flex flex-col max-w-[960px]">
      <header className="mb-5">
        <h1 className="page-title">Saldo por produto</h1>
        <p className="page-subtitle">
          Paletes disponíveis por produto e por OF. Para dar entrada, use a tela de Estoque.
        </p>

        <div className="flex flex-wrap items-center mt-5">
          <div className="kpi">
            <span className="kpi-valor text-emerald-400">{fmt(totalPaletes)}</span>
            <span className="kpi-rotulo">Paletes disponíveis</span>
          </div>
          <div className="kpi">
            <span className="kpi-valor text-white">{produtosComSaldo}</span>
            <span className="kpi-rotulo">Produtos com saldo</span>
          </div>
          <div className="kpi">
            <span className="kpi-valor text-white">{ofsAtivas}</span>
            <span className="kpi-rotulo">OFs ativas</span>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-3.5">
        <div className="relative flex-1 min-w-[220px]">
          <Icon icon="tabler:search" width={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-field w-full pl-10"
            placeholder="Buscar por produto, OF ou nº da NF..."
          />
        </div>

        <div className="seg" role="group" aria-label="Filtrar produtos">
          {([
            { valor: "saldo", rotulo: "Com saldo" },
            { valor: "todos", rotulo: "Todos" },
          ] as const).map((op) => (
            <button
              key={op.valor}
              type="button"
              data-tipo="neutro"
              aria-pressed={filtro === op.valor}
              onClick={() => setFiltro(op.valor)}
              className="seg-btn normal-case tracking-normal text-[13px] font-medium"
            >
              {op.rotulo}
            </button>
          ))}
        </div>
      </div>

      {gruposFiltrados.length === 0 ? (
        <div className="saldo-lista">
          <p className="py-11 px-4 text-center font-mono text-[13px] text-brand-label">
            {busca
              ? "Nenhum produto encontrado para essa busca."
              : "Nenhum produto com saldo disponível."}
          </p>
        </div>
      ) : (
        <>
          <div className="saldo-lista">
            {gruposFiltrados.map((grupo) => {
              const aberto = gruposAbertos.has(grupo.key) || !!busca;
              const zerado = grupo.saldoPalTotal <= 0;
              const comSaldo = grupo.notas.filter((n) => n.saldoPal > 0).length;
              const qtdOfs = grupo.notas.length;

              return (
                <div key={grupo.key} className="saldo-linha">
                  <button
                    type="button"
                    onClick={() => toggleGrupo(grupo.key)}
                    aria-expanded={aberto}
                    className="saldo-cabecalho"
                  >
                    <span className="saldo-icone" data-zerado={zerado}>
                      <Icon icon="tabler:box" width={19} />
                    </span>

                    <span className="min-w-0">
                      {/* No celular o nome quebra em duas linhas; truncar so a partir
                          de sm, onde ha largura sobrando. */}
                      <span className="saldo-nome sm:truncate">{grupo.nome}</span>
                      <span className="saldo-meta">
                        {qtdOfs} {qtdOfs === 1 ? "OF" : "OFs"} ·{" "}
                        {zerado ? "sem saldo" : `${comSaldo} com saldo`}
                      </span>
                    </span>

                    <span className="text-right">
                      <span className="kpi-rotulo hidden sm:block">Paletes disp.</span>
                      <span className="saldo-total block" data-zerado={zerado}>
                        {fmt(grupo.saldoPalTotal)}
                      </span>
                      {grupo.valorSaldoTotal > 0 && (
                        <span className="block font-mono text-[11px] text-brand-light">
                          {fmtMoeda(grupo.valorSaldoTotal)}
                        </span>
                      )}
                    </span>

                    <span className="saldo-chevron" data-aberto={aberto} aria-hidden="true">
                      <Icon icon="tabler:chevron-down" width={18} />
                    </span>
                  </button>

                  <div className="saldo-detalhe" data-aberto={aberto}>
                    <div>
                      <div className="pl-[72px] pr-[18px] pb-4 pt-0.5 max-sm:pl-[18px]">
                        {grupo.notas.map((item) => {
                          const notaZerada = item.saldoPal <= 0;
                          // Proporcao do que ainda resta desta OF, para bater com o
                          // "X de Y" ao lado -- ambos usam o recebido como base.
                          const pct = item.inicialPal > 0
                            ? Math.max(4, Math.round((item.saldoPal / item.inicialPal) * 100))
                            : 4;

                          return (
                            <div key={item.nota.id} className="saldo-of">
                              <span className="font-mono text-[13px] text-white whitespace-nowrap">
                                OF {item.ofNumero}
                              </span>
                              <span className="saldo-of-nf font-mono text-xs text-brand-label whitespace-nowrap">
                                NF prod <span className="text-brand-light">{item.nota.numero || "—"}</span>
                              </span>
                              <span className="saldo-of-nf font-mono text-xs text-brand-label whitespace-nowrap">
                                NF pal <span className="text-brand-light">{item.nota.nf_palete || "—"}</span>
                              </span>
                              <span className="saldo-barra">
                                <span
                                  className="saldo-barra-fill"
                                  data-zerado={notaZerada}
                                  style={{ width: `${notaZerada ? 4 : pct}%` }}
                                />
                              </span>
                              <span className="flex flex-col items-end gap-1 text-right min-w-[74px]">
                                <span
                                  className={`font-mono text-[13px] whitespace-nowrap ${
                                    notaZerada ? "text-brand-muted" : "text-emerald-400"
                                  }`}
                                >
                                  {fmt(item.saldoPal)} de {fmt(item.inicialPal)} pal
                                </span>

                                {editando === item.nota.id ? (
                                  <span className="flex flex-col items-end gap-1">
                                    <span className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        autoFocus
                                        value={valorInput}
                                        onChange={(e) => setValorInput(e.target.value)}
                                        placeholder="R$/cx"
                                        className="input-field h-7 w-[92px] px-2 py-1 text-right text-xs"
                                        aria-label={`Valor por caixa da OF ${item.ofNumero}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => salvarValor(item.nota.id)}
                                        disabled={salvandoValor}
                                        className="mov-icon-btn"
                                        title="Salvar valor"
                                        aria-label="Salvar valor"
                                      >
                                        <Icon icon="tabler:check" width={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setEditando(null); setErroValor(""); }}
                                        className="mov-icon-btn"
                                        title="Cancelar"
                                        aria-label="Cancelar"
                                      >
                                        <Icon icon="tabler:x" width={14} />
                                      </button>
                                    </span>
                                    {erroValor && (
                                      <span className="text-[10px] text-red-400">{erroValor}</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                    <span className={item.valorUnitario > 0 ? "text-brand-light" : "text-amber-400"}>
                                      {item.valorUnitario > 0 ? `${fmtMoeda(item.valorUnitario)}/cx` : "sem valor"}
                                    </span>
                                    {podeEditar && (
                                      <button
                                        type="button"
                                        onClick={() => abrirEdicao(item.nota.id, item.valorUnitario)}
                                        className="mov-icon-btn"
                                        title="Editar valor"
                                        aria-label={`Editar valor da OF ${item.ofNumero}`}
                                      >
                                        <Icon icon="tabler:pencil" width={13} />
                                      </button>
                                    )}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3.5 text-right font-mono text-xs text-brand-label">
            {gruposFiltrados.length} de {grupos.length} produtos
          </p>
        </>
      )}
    </div>
  );
}
