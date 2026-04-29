"use client";

import { Icon } from "@iconify/react";
import { useValorOculto } from "@/contexts/ValorOcultoContext";
import ValorPrivado from "@/components/shared/ValorPrivado";

export default function CardValorEstoque({ valor }: { valor: string }) {
  const { oculto, toggle } = useValorOculto();

  return (
    <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-2xl p-5 flex flex-col gap-4 hover:border-brand-border-hl transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-medium uppercase tracking-wider">Valor em estoque</span>
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg bg-brand-hover flex items-center justify-center text-brand-light hover:text-white transition-colors duration-150"
          title={oculto ? "Mostrar valores" : "Ocultar valores"}
        >
          <Icon icon={oculto ? "tabler:eye-off" : "tabler:currency-dollar"} width={15} />
        </button>
      </div>
      <ValorPrivado className="text-3xl font-bold text-white tracking-tight leading-tight">
        {valor}
      </ValorPrivado>
      <span className="text-xs text-brand-muted border-t border-brand-border pt-3">preço de custo</span>
    </div>
  );
}
