function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "#1a1a2e", ...style }} />;
}

function LinhaTabela() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: "#1a1a2e" }}>
      <Skeleton className="h-3 w-20 shrink-0" />
      <Skeleton className="h-3 w-28 shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-5 w-14 shrink-0" style={{ borderRadius: 999 }} />
      <Skeleton className="h-3 w-16 shrink-0" />
      <Skeleton className="h-3 w-12 shrink-0" />
    </div>
  );
}

export default function EstoqueLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <Skeleton className="h-9 w-44" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1a1a2e" }}>
        <div className="px-4 py-3 border-b" style={{ background: "#0d0d15", borderColor: "#1a1a2e" }}>
          <div className="flex gap-4">
            {["w-20", "w-28", "flex-1", "w-14", "w-16", "w-12"].map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w} shrink-0`} />
            ))}
          </div>
        </div>
        {[...Array(8)].map((_, i) => <LinhaTabela key={i} />)}
      </div>
    </div>
  );
}
