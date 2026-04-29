import React from "react";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "#1a1a2e", ...style }} />;
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      {/* Cards KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#0d0d15", border: "1px solid #1a1a2e" }}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-2 w-16" />
          </div>
        ))}
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#0d0d15", border: "1px solid #1a1a2e" }}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "#0d0d15", border: "1px solid #1a1a2e" }}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full rounded-full mx-auto" style={{ maxWidth: 180 }} />
        </div>
      </div>
    </div>
  );
}
