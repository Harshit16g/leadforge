export function LeadTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-slate-100 rounded-lg w-full" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-xl">
          <div className="w-10 h-10 bg-slate-100 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-3 bg-slate-50 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
