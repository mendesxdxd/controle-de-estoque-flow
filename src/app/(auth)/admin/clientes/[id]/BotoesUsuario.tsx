"use client";

import { useState } from "react";

type Props = {
  userId: string;
  tenantId: string;
  podeFechamento: boolean;
  atualizarPermissao: (userId: string, podeFechamento: boolean, tenantId: string) => Promise<{ erro: string } | undefined>;
  excluirUsuario: (userId: string, tenantId: string) => Promise<{ erro: string } | undefined>;
};

export default function BotoesUsuario({ userId, tenantId, podeFechamento, atualizarPermissao, excluirUsuario }: Props) {
  const [atualizando, setAtualizando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleToggle() {
    setAtualizando(true);
    await atualizarPermissao(userId, !podeFechamento, tenantId);
    setAtualizando(false);
  }

  async function handleExcluir() {
    if (!confirm("Deseja excluir este usuario?")) return;
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
        onClick={handleExcluir}
        disabled={excluindo}
        className="btn-danger text-xs"
      >
        {excluindo ? "..." : "Excluir"}
      </button>
    </div>
  );
}
