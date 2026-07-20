"use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { Produto } from "@/types";
import { criarEntradaOF } from "@/app/(auth)/ordens-frete/actions";
import Manifesto, { ManifestoItem } from "./Manifesto";

type ItemForm = {
  // id estavel de UI: a key precisa acompanhar a linha, nao a posicao, senao
  // remover uma linha do meio faz o foco/estado do input vazar para a vizinha.
  uid: number;
  produto_id: string;
  numero: string;
  nfPalete: string;
  quantidade: string;
  unidade: "cx" | "palete";
};

type Props = {
  produtos: Produto[];
  notaObrigatoria: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
};

let seqItem = 0;
function novoItem(): ItemForm {
  return { uid: seqItem++, produto_id: "", numero: "", nfPalete: "", quantidade: "1", unidade: "cx" };
}

export default function FormularioEntrada({ produtos, notaObrigatoria, onFechar, onSucesso }: Props) {
  const [numeroOF, setNumeroOF] = useState("");
  const [transportadora, setTransportadora] = useState<"MA TRANSP" | "OUTRAS" | "">("");
  const [itens, setItens] = useState<ItemForm[]>(() => [novoItem()]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function atualizarItem(index: number, campo: keyof ItemForm, valor: string) {
    setItens((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      if (campo === "produto_id") {
        const prod = produtos.find((p) => p.id === valor);
        return { ...item, produto_id: valor, unidade: prod?.caixas_por_palete ? "palete" : "cx" };
      }
      return { ...item, [campo]: valor };
    }));
  }

  function calcularQtdCaixas(item: ItemForm): number {
    const produto = produtos.find((p) => p.id === item.produto_id);
    const qtd = parseInt(item.quantidade) || 0;
    if (item.unidade === "palete" && produto?.caixas_por_palete) {
      return qtd * produto.caixas_por_palete;
    }
    return qtd;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setErro("");

    if (!numeroOF.trim()) {
      setErro("Numero da OF e obrigatorio.");
      return;
    }

    for (const item of itens) {
      if (!item.produto_id) {
        setErro("Selecione o produto em todas as linhas.");
        return;
      }
      if (!parseInt(item.quantidade) || parseInt(item.quantidade) <= 0) {
        setErro("A quantidade de cada produto deve ser maior que zero.");
        return;
      }
    }

    type NotaPayload = {
      tipo: "produto";
      numero: string | null;
      nf_palete: string | null;
      produto_id: string | null;
      quantidade_inicial: number;
      observacao: string | null;
    };

    const notas: NotaPayload[] = itens.map((item) => ({
      tipo: "produto",
      numero: item.numero.trim() || null,
      nf_palete: item.nfPalete.trim() || null,
      produto_id: item.produto_id,
      quantidade_inicial: calcularQtdCaixas(item),
      observacao: item.unidade === "palete" ? `${parseInt(item.quantidade)} palete(s)` : null,
    }));

    setSalvando(true);
    try {
      const resultado = await criarEntradaOF({
        numero: numeroOF.trim(),
        observacao: null,
        transportadora: transportadora || null,
        notas,
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

  const itensManifesto: ManifestoItem[] = useMemo(
    () =>
      itens.map((item) => {
        const produto = produtos.find((p) => p.id === item.produto_id);
        const qtdNum = parseInt(item.quantidade) || 0;
        return {
          produto: produto?.nome ?? null,
          nfProduto: item.numero.trim() || null,
          nfPalete: item.nfPalete.trim() || null,
          quantidade: calcularQtdCaixas(item),
          detalhe: item.unidade === "palete" && qtdNum > 0 ? `${qtdNum} palete(s)` : null,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, produtos]
  );

  // So conta linha com produto escolhido: a linha em branco ja nasce com
  // quantidade 1 e inflaria o total antes de o usuario preencher qualquer coisa.
  const totalCaixas = itensManifesto
    .filter((item) => item.produto)
    .reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={handleSubmit} className="mov-form flex flex-col gap-5 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 max-w-2xl">
          <div className="rom-campo">
            <label htmlFor="entrada-of" className="rom-label">Numero da OF</label>
            <input
              id="entrada-of"
              type="text"
              value={numeroOF}
              onChange={(e) => setNumeroOF(e.target.value)}
              className="rom-input"
              placeholder="6100181424"
            />
          </div>
          <div className="rom-campo">
            <label className="rom-label">
              Transportadora <span className="normal-case tracking-normal font-normal">(opcional)</span>
            </label>
            <div className="flex items-center gap-5 py-1.5" role="group" aria-label="Transportadora">
              {(["MA TRANSP", "OUTRAS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={transportadora === t}
                  onClick={() => setTransportadora(transportadora === t ? "" : t)}
                  className="rom-radio"
                >
                  <span className="rom-radio-marca" aria-hidden="true" />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Produtos / Notas */}
        <div className="flex flex-col gap-2.5">
          <label className="rom-label">Produtos / Notas</label>

          {/* Cabecalho das colunas (some quando a linha empilha) */}
          <div className="mov-grid mov-grid-head rom-cabecalho">
            <span className="mov-col-label">Item</span>
            <span className="mov-col-label">Produto</span>
            <span className="mov-col-label">NF prod.</span>
            <span className="mov-col-label">NF palete</span>
            <span className="mov-col-label">Unidade</span>
            <span className="mov-col-label">Qtd</span>
            <span className="sr-only">Ações</span>
          </div>

          {itens.map((item, index) => {
            const produto = produtos.find((p) => p.id === item.produto_id);
            const caixasPorPalete = produto?.caixas_por_palete ?? null;
            const qtdNum = parseInt(item.quantidade) || 0;
            const qtdEmCaixas = item.unidade === "palete" && caixasPorPalete ? qtdNum * caixasPorPalete : qtdNum;

            return (
              <div key={item.uid} className="rom-linha mov-grid">
                <div className="flex items-center gap-2">
                  <span className="mov-col-label mov-label-linha">Item</span>
                  <span className="rom-num">{String(index + 1).padStart(2, "0")}</span>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <span className="mov-col-label mov-label-linha">Produto</span>
                  <select
                    value={item.produto_id}
                    onChange={(e) => atualizarItem(index, "produto_id", e.target.value)}
                    className="rom-input rom-texto"
                    aria-label={`Produto da linha ${index + 1}`}
                  >
                    <option value="">Selecione...</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <span className="mov-col-label mov-label-linha">NF produto</span>
                  <input
                    type="text"
                    value={item.numero}
                    onChange={(e) => atualizarItem(index, "numero", e.target.value)}
                    className="rom-input"
                    placeholder="12345"
                    aria-label={`NF do produto da linha ${index + 1}`}
                  />
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <span className="mov-col-label mov-label-linha">NF palete</span>
                  <input
                    type="text"
                    value={item.nfPalete}
                    onChange={(e) => atualizarItem(index, "nfPalete", e.target.value)}
                    className="rom-input"
                    placeholder="6789"
                    aria-label={`NF do palete da linha ${index + 1}`}
                  />
                </div>

                {/* A coluna existe sempre para as linhas nao desalinharem. Sem
                    caixas_por_palete o produto so entra em caixas. */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="mov-col-label mov-label-linha">Unidade</span>
                  {caixasPorPalete ? (
                    <div className="flex items-center gap-3" role="group" aria-label={`Unidade da linha ${index + 1}`}>
                      {(["cx", "palete"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          aria-pressed={item.unidade === u}
                          onClick={() => atualizarItem(index, "unidade", u)}
                          className="rom-radio"
                        >
                          <span className="rom-radio-marca" aria-hidden="true" />
                          {u === "cx" ? "cx" : "pal"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span
                      className="rom-radio"
                      title="Este produto não tem caixas por palete cadastrado."
                    >
                      cx
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <span className="mov-col-label mov-label-linha">
                    Qtd {item.unidade === "palete" ? "(paletes)" : "(caixas)"}
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, "quantidade", e.target.value)}
                    className="rom-input text-right"
                    aria-label={`Quantidade da linha ${index + 1}`}
                  />
                  {caixasPorPalete && item.unidade === "palete" && qtdNum > 0 && (
                    <span className="text-[10px] font-mono text-brand-primary text-right">= {qtdEmCaixas} cx</span>
                  )}
                </div>

                <div className="flex justify-end">
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItens((prev) => prev.filter((_, i) => i !== index))}
                      className="mov-icon-btn"
                      title="Remover"
                      aria-label={`Remover a linha ${index + 1}`}
                    >
                      <Icon icon="tabler:trash" width={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setItens((prev) => [...prev, novoItem()])}
            className="btn-action flex items-center gap-1.5 w-fit rounded-lg px-1 py-1"
          >
            <Icon icon="tabler:plus" width={13} aria-hidden="true" />
            Adicionar item
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
            {salvando ? "Salvando..." : "Registrar entrada"}
          </button>
          <button type="button" onClick={onFechar} className="btn-secondary">Limpar</button>
        </div>
      </form>

      <Manifesto
        tipo="entrada"
        documento={numeroOF.trim() || null}
        transportadora={transportadora || null}
        itens={itensManifesto}
        total={totalCaixas}
        unidade="caixas"
      />
    </div>
  );
}
