function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "#1a1a2e" }} />;
}

function LinhaTabela() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: "#1a1a2e" }}>
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-24 shrink-0" />
      <Skeleton className="h-3 w-16 shrink-0" />
      <Skeleton className="h-3 w-20 shrink-0" />
      <Skeleton className="h-3 w-20 shrink-0" />
    </div>
  );
}

export default function ProdutosLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1a1a2e" }}>
        <div className="px-4 py-3 border-b" style={{ background: "#0d0d15", borderColor: "#1a1a2e" }}>
          <div className="flex gap-4">
            {["flex-1", "w-24", "w-16", "w-20", "w-20"].map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w} shrink-0`} />
            ))}
          </div>
        </div>
        {[...Array(6)].map((_, i) => <LinhaTabela key={i} />)}
      </div>
    </div>
  );
}
