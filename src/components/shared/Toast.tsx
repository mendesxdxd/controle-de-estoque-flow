"use client";

import { useEffect } from "react";

type Props = {
  mensagem: string;
  onClose: () => void;
};

export default function Toast({ mensagem, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-sm font-medium px-5 py-3 shadow-lg whitespace-nowrap">
      {mensagem}
    </div>
  );
}
