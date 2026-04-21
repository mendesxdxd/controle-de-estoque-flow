"use client";

import { useState } from "react";
import { excluirTenant } from "./actions";

export default function BotaoExcluirTenant({ id, nome }: { id: string; nome: string }) {
  const [excluindo, setExcluindo] = useState(false);

  async function handleExcluir() {
    if (!confirm(`Deseja excluir o cliente "${nome}"? Todos os dados vinculados serao perdidos.`)) return;
    setExcluindo(true);
    await excluirTenant(id);
    setExcluindo(false);
  }

  return (
    <button onClick={handleExcluir} disabled={excluindo} className="btn-danger text-xs">
      {excluindo ? "..." : "Excluir"}
    </button>
  );
}
