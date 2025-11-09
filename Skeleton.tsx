// src/components/Skeleton.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[#1A1A1F] via-[#2C2C34] to-[#1A1A1F] bg-[length:200%_100%] rounded ${className}`}
      style={{ animation: "shimmer 2s infinite" }}
    />
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#2C2C34]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-10 w-16" />
    </div>
  );
}

// License Card Skeleton
export function LicenseCardSkeleton() {
  return (
    <div className="bg-[#1A1A1F] border border-[#2C2C34] rounded-xl p-6">
      <Skeleton className="h-5 w-16 mb-3" />
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Full Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-10 w-64 mb-8" />
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Lizenzen */}
      <Skeleton className="h-8 w-32 mb-4" />
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LicenseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Add to index.css:
/*
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
*/