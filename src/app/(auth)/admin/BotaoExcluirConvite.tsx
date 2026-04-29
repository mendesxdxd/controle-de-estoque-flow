"use client";

import { excluirConvite } from "./actions";

export default function BotaoExcluirConvite({ id }: { id: string }) {
  async function handleExcluir() {
    if (!confirm("Excluir este convite?")) return;
    await excluirConvite(id);
  }

  return (
    <button onClick={handleExcluir} className="btn-danger text-xs">
      Excluir
    </button>
  );
}
