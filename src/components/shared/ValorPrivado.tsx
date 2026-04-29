"use client";

import { useValorOculto } from "@/contexts/ValorOcultoContext";

export default function ValorPrivado({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { oculto } = useValorOculto();

  return (
    <span
      className={className}
      style={{
        filter: oculto ? "blur(8px)" : "none",
        userSelect: oculto ? "none" : "auto",
        transition: "filter 0.2s ease",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}
