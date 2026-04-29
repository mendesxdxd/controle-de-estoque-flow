function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "#1a1a2e" }} />;
}

function SecaoTabela({ colunas, linhas }: { colunas: string[]; linhas: number }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid #252540" }}>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1a1a2e" }}>
        <div className="px-4 py-3 border-b" style={{ background: "#0d0d15", borderColor: "#1a1a2e" }}>
          <div className="flex gap-4">
            {colunas.map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w} shrink-0`} />
            ))}
          </div>
        </div>
        {[...Array(linhas)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: "#1a1a2e" }}>
            {colunas.map((w, j) => (
              <Skeleton key={j} className={`h-3 ${w} shrink-0`} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RelatoriosLoading() {
  return (
    <div className="flex flex-col gap-12">
      <SecaoTabela colunas={["flex-1", "w-20", "w-14", "w-24", "w-24", "w-28", "w-16"]} linhas={6} />
      <SecaoTabela colunas={["flex-1", "w-14", "w-24", "w-20"]} linhas={3} />
      <SecaoTabela colunas={["w-20", "flex-1", "w-16", "w-20", "w-28"]} linhas={5} />
    </div>
  );
}
