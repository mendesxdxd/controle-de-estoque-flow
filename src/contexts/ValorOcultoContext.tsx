"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ValorOcultoContextType = {
  oculto: boolean;
  toggle: () => void;
};

const ValorOcultoContext = createContext<ValorOcultoContextType>({
  oculto: false,
  toggle: () => {},
});

export function ValorOcultoProvider({ children }: { children: React.ReactNode }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("valores-ocultos");
    if (salvo === "true") setOculto(true);
  }, []);

  function toggle() {
    setOculto((v) => {
      localStorage.setItem("valores-ocultos", String(!v));
      return !v;
    });
  }

  return (
    <ValorOcultoContext.Provider value={{ oculto, toggle }}>
      {children}
    </ValorOcultoContext.Provider>
  );
}

export function useValorOculto() {
  return useContext(ValorOcultoContext);
}
