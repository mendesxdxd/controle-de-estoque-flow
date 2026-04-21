"use client";

import { useState } from "react";

type Props = {
  userId: string;
  tenantId: string;
  podeFechamento: boolean;
  atualizarPermissao: (userId: string, podeFechamento: boolean, tenantId: string) => Promise<{ erro: string } | undefined>;
  desvincularUsuario: (userId: string, tenantId: string) => Promise<{ erro: string } | undefined>;
  excluirUsuario: (userId: string, tenantId: string) => Promise<{ erro: string } | undefined>;
};

export default function BotoesUsuario({ userId, tenantId, podeFechamento, atualizarPermissao, desvincularUsuario, excluirUsuario }: Props) {
  const [atualizando, setAtualizando] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleToggle() {
    setAtualizando(true);
    await atualizarPermissao(userId, !podeFechamento, tenantId);
    setAtualizando(false);
  }

  async function handleDesvincular() {
    if (!confirm("Deseja remover este usuario da empresa? O acesso sera revogado mas a conta sera mantida.")) return;
    setDesvinculando(true);
    await desvincularUsuario(userId, tenantId);
    setDesvinculando(false);
  }

  async function handleExcluir() {
    if (!confirm("Deseja excluir permanentemente este usuario? Esta acao nao pode ser desfeita.")) return;
    setExcluindo(true);
    await excluirUsuario(userId, tenantId);
    setExcluindo(false);
  }

  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={handleToggle}
        disabled={atualizando}
        className="btn-secondary text-xs"
      >
        {atualizando ? "..." : podeFechamento ? "Bloquear" : "Liberar"}
      </button>
      <button
        onClick={handleDesvincular}
        disabled={desvinculando}
        className="btn-secondary text-xs"
      >
        {desvinculando ? "..." : "Remover"}
      </button>
      <button
        onClick={handleExcluir}
        disabled={excluindo}
        className="btn-danger text-xs"
      >
        {excluindo ? "..." : "Excluir"}
      </button>
    </div>
  );
}
