// Shimmer placeholders shown via route loading.tsx while Supabase data loads.
export function SkBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />;
}

export function SkCard() {
  return (
    <div className="card space-y-3">
      <SkBar className="h-4 w-1/3" />
      <SkBar className="h-3 w-2/3" />
      <SkBar className="h-3 w-1/2" />
    </div>
  );
}

export function PageSkeleton({ hero = true, cards = 3 }: { hero?: boolean; cards?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkBar className="h-3 w-24" />
        <SkBar className="h-7 w-1/2" />
      </div>
      {hero && <div className="h-32 animate-pulse rounded-3xl bg-ink-100" />}
      <div className="space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <SkCard key={i} />
        ))}
      </div>
    </div>
  );
}
