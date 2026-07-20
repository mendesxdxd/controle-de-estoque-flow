"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { OrdemFrete, NotaSaldo } from "@/types";
import { registrarSaidaMultiNota } from "@/app/(auth)/ordens-frete/actions";
import Manifesto, { ManifestoItem } from "./Manifesto";

type Props = {
  ofs: OrdemFrete[];
  saldos: NotaSaldo[];
  onFechar: () => void;
  onSucesso?: () => void;
};

type NotaDisp = {
  notaId: string;
  produtoId: string;
  produtoNome: string;
  ofId: string;
  ofNumero: string;
  nfProduto: string | null;
  cxp: number | null;
  saldoCx: number;
};

/** Uma linha do carregamento: qual produto, de qual nota e quanto sai dela. */
type LinhaSaida = {
  produtoId: string;
  notaId: string;
  quantidade: string;
};

function fmt(n: number) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function paletesDe(caixas: number, cxp: number | null) {
  return cxp && cxp > 0 ? caixas / cxp : caixas;
}

function novaLinha(): LinhaSaida {
  return { produtoId: "", notaId: "", quantidade: "" };
}

export default function FormularioSaida({ ofs, saldos, onFechar, onSucesso }: Props) {
  const [ofSaida, setOfSaida] = useState("");
  const [linhas, setLinhas] = useState<LinhaSaida[]>([novaLinha()]);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const saldoPorNota = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of saldos) m.set(s.nota_id, Number(s.saldo));
    return m;
  }, [saldos]);

  // Notas de produto com saldo > 0 (achatadas com a OF de origem).
  const notasDisp = useMemo(() => {
    const arr: NotaDisp[] = [];
    for (const of of ofs) {
      for (const n of of.notas ?? []) {
        if (n.tipo !== "produto" || !n.produto_id) continue;
        const saldoCx = saldoPorNota.get(n.id) ?? 0;
        if (saldoCx <= 0) continue;
        arr.push({
          notaId: n.id,
          produtoId: n.produto_id,
          produtoNome: n.produtos?.nome ?? "Produto",
          ofId: of.id,
          ofNumero: of.numero,
          nfProduto: n.numero,
          cxp: n.produtos?.caixas_por_palete ?? null,
          saldoCx,
        });
      }
    }
    return arr;
  }, [ofs, saldoPorNota]);

  const notaPorId = useMemo(() => {
    const m = new Map<string, NotaDisp>();
    for (const n of notasDisp) m.set(n.notaId, n);
    return m;
  }, [notasDisp]);

  const produtos = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notasDisp) m.set(n.produtoId, n.produtoNome);
    return [...m.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [notasDisp]);

  const notasUsadas = new Set(linhas.map((l) => l.notaId).filter(Boolean));
  const todasNotasUsadas = notasUsadas.size >= notasDisp.length;

  function atualizarLinha(index: number, campo: keyof LinhaSaida, valor: string) {
    setLinhas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        // Trocar o produto invalida a nota escolhida, que era de outro produto.
        if (campo === "produtoId") return { ...l, produtoId: valor, notaId: "" };
        return { ...l, [campo]: valor };
      })
    );
  }

  /** Saldo da nota da linha, em paletes. */
  function saldoDaLinha(linha: LinhaSaida): number {
    const nota = notaPorId.get(linha.notaId);
    return nota ? paletesDe(nota.saldoCx, nota.cxp) : 0;
  }

  function excedeuLinha(linha: LinhaSaida): boolean {
    if (!linha.notaId) return false;
    return (Number(linha.quantidade) || 0) > saldoDaLinha(linha) + 1e-9;
  }

  const totalPaletes = linhas.reduce((soma, l) => soma + (Number(l.quantidade) || 0), 0);
  const algumaExcede = linhas.some(excedeuLinha);

  const itensManifesto: ManifestoItem[] = linhas
    .filter((l) => l.notaId)
    .map((l) => {
      const nota = notaPorId.get(l.notaId)!;
      const qtd = Number(l.quantidade) || 0;
      return {
        produto: nota.produtoNome,
        nfProduto: nota.nfProduto,
        quantidade: qtd,
        detalhe: `OF ${nota.ofNumero}${nota.cxp && qtd > 0 ? ` · = ${fmt(qtd * nota.cxp)} cx` : ""}`,
      };
    });

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErro("");

    if (!ofSaida.trim()) {
      setErro("Numero da OF de saida e obrigatorio.");
      return;
    }

    for (const linha of linhas) {
      if (!linha.produtoId) {
        setErro("Selecione o produto em todas as linhas.");
        return;
      }
      if (!linha.notaId) {
        setErro("Selecione a OF em todas as linhas.");
        return;
      }
      const qtd = Number(linha.quantidade);
      if (!qtd || qtd <= 0) {
        setErro("A quantidade de cada linha deve ser maior que zero.");
        return;
      }
      if (qtd > saldoDaLinha(linha) + 1e-9) {
        const nota = notaPorId.get(linha.notaId)!;
        setErro(`Saldo insuficiente na OF ${nota.ofNumero}. Disponivel: ${fmt(saldoDaLinha(linha))} paletes.`);
        return;
      }
    }

    const itens = linhas.map((linha) => {
      const nota = notaPorId.get(linha.notaId)!;
      const qtd = Number(linha.quantidade);
      return {
        nota_id: linha.notaId,
        quantidade: nota.cxp && nota.cxp > 0 ? qtd * nota.cxp : qtd,
      };
    });

    setSalvando(true);
    try {
      const resultado = await registrarSaidaMultiNota({
        itens,
        observacao: observacao.trim() || null,
        of_saida: ofSaida.trim(),
      });
      if (resultado?.erro) {
        setErro(resultado.erro);
        return;
      }
      onFechar();
      onSucesso?.();
    } finally {
      setSalvando(false);
    }
  }

  if (notasDisp.length === 0) {
    return (
      <div className="empty-state">
        <span className="text-brand-muted"><Icon icon="tabler:package-off" width={32} /></span>
        <p className="empty-state-text">
          Nenhum produto com saldo disponível para saída.
          <br />
          Registre uma entrada para liberar saldo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={handleSubmit} className="mov-form flex flex-col gap-5 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 max-w-2xl">
          <div className="rom-campo">
            <label htmlFor="saida-of" className="rom-label">OF de saída</label>
            <input
              id="saida-of"
              type="text"
              value={ofSaida}
              onChange={(e) => setOfSaida(e.target.value)}
              className="rom-input"
              placeholder="Ex: 6100189261"
            />
          </div>
          <div className="rom-campo">
            <label htmlFor="saida-obs" className="rom-label">
              Observação <span className="normal-case tracking-normal font-normal">(opcional)</span>
            </label>
            <input
              id="saida-obs"
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="rom-input rom-texto"
              placeholder="Ex: Caminhão placa ABC-1234"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="rom-label">Produtos / Notas de origem</label>

          <div className="mov-grid-saida mov-grid-head rom-cabecalho">
            <span className="mov-col-label">Item</span>
            <span className="mov-col-label">Produto</span>
            <span className="mov-col-label">Ordem de Frete</span>
            <span className="mov-col-label">Qtd (pal)</span>
            <span className="sr-only">Ações</span>
          </div>

          {linhas.map((linha, index) => {
            const nota = notaPorId.get(linha.notaId) ?? null;
            const saldo = saldoDaLinha(linha);
            const excedeu = excedeuLinha(linha);
            const qtd = Number(linha.quantidade) || 0;

            // Notas do produto da linha, tirando as ja usadas em outras linhas.
            const opcoesNota = notasDisp.filter(
              (n) =>
                n.produtoId === linha.produtoId &&
                (n.notaId === linha.notaId || !notasUsadas.has(n.notaId))
            );

            return (
              <div key={index} className="rom-linha flex flex-col gap-2">
                <div className="mov-grid-saida">
                  <div className="flex items-center gap-2">
                    <span className="mov-col-label mov-label-linha">Item</span>
                    <span className="rom-num">{String(index + 1).padStart(2, "0")}</span>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="mov-col-label mov-label-linha">Produto</span>
                    <select
                      value={linha.produtoId}
                      onChange={(e) => atualizarLinha(index, "produtoId", e.target.value)}
                      className="rom-input rom-texto"
                      aria-label={`Produto da linha ${index + 1}`}
                    >
                      <option value="">Selecione...</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="mov-col-label mov-label-linha">Ordem de Frete</span>
                    <select
                      value={linha.notaId}
                      onChange={(e) => atualizarLinha(index, "notaId", e.target.value)}
                      disabled={!linha.produtoId}
                      className="rom-input rom-texto disabled:opacity-40"
                      aria-label={`Ordem de frete da linha ${index + 1}`}
                    >
                      <option value="">{linha.produtoId ? "Selecione a OF..." : "Escolha o produto"}</option>
                      {opcoesNota.map((n) => (
                        <option key={n.notaId} value={n.notaId}>
                          OF {n.ofNumero}
                          {n.nfProduto ? ` • NF ${n.nfProduto}` : ""} • {fmt(paletesDe(n.saldoCx, n.cxp))} pal
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="mov-col-label mov-label-linha">Qtd (paletes)</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={linha.quantidade}
                      onChange={(e) => atualizarLinha(index, "quantidade", e.target.value)}
                      className="rom-input text-right"
                      placeholder="0"
                      aria-invalid={excedeu}
                      aria-label={`Quantidade da linha ${index + 1}`}
                    />
                  </div>

                  <div className="flex justify-end">
                    {linhas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLinhas((prev) => prev.filter((_, i) => i !== index))}
                        className="mov-icon-btn"
                        title="Remover"
                        aria-label={`Remover a linha ${index + 1}`}
                      >
                        <Icon icon="tabler:trash" width={14} />
                      </button>
                    )}
                  </div>
                </div>

                {nota && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mov-chip" data-excedido={excedeu}>
                      <Icon icon={excedeu ? "tabler:alert-triangle" : "tabler:stack-2"} width={12} aria-hidden="true" />
                      Disponível: {fmt(saldo)} paletes
                    </span>
                    {nota.cxp && qtd > 0 && (
                      <span className="text-[10px] font-mono text-brand-primary">
                        = {fmt(qtd * nota.cxp)} caixas
                      </span>
                    )}
                  </div>
                )}

                {excedeu && (
                  <p className="mov-aviso" role="alert">
                    <Icon icon="tabler:alert-triangle" width={14} className="shrink-0" />
                    Excede o saldo desta nota em {fmt(qtd - saldo)} paletes.
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setLinhas((prev) => [...prev, novaLinha()])}
            disabled={todasNotasUsadas}
            className="btn-action flex items-center gap-1.5 w-fit rounded-lg px-1 py-1 disabled:opacity-40 disabled:pointer-events-none"
            title={todasNotasUsadas ? "Todas as notas com saldo já estão nesta saída." : undefined}
          >
            <Icon icon="tabler:plus" width={13} aria-hidden="true" />
            Adicionar produto
          </button>
        </div>

        {erro && (
          <p className="mov-aviso" role="alert">
            <Icon icon="tabler:alert-triangle" width={14} className="shrink-0" />
            {erro}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? "Registrando..." : "Registrar saída"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary">Limpar</button>
        </div>
      </form>

      <Manifesto
        tipo="saida"
        documento={ofSaida.trim() || null}
        observacao={observacao.trim() || null}
        itens={itensManifesto}
        total={totalPaletes}
        unidade="paletes"
        aviso={algumaExcede ? "Alguma linha excede o saldo da nota." : null}
      />
    </div>
  );
}
