'use client';

// Skeleton uses shimmer animation defined in globals.css
function Bone({ className }: { className: string }) {
  return <div className={`animate-shimmer rounded ${className}`} />;
}

export default function MainLoading() {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border min-h-[56px]">
        <div className="flex items-center gap-2">
          <Bone className="h-7 w-7 rounded-lg" />
          <Bone className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-8 w-20 rounded-md" />
          <Bone className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Page title */}
        <Bone className="h-7 w-36 rounded-lg" />

        {/* Quick action grid — 3 columns */}
        <div className="space-y-3">
          <Bone className="h-3.5 w-20 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4"
              >
                <Bone className="h-12 w-12 rounded-xl" />
                <Bone className="h-3 w-14" />
                <Bone className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Bone className="h-3.5 w-16 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4"
              >
                <Bone className="h-12 w-12 rounded-xl" />
                <Bone className="h-3 w-14" />
                <Bone className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-around px-2 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 px-3 py-1.5">
              <Bone className="h-5 w-5 rounded-md" />
              <Bone className="h-2 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
