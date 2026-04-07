import Navbar from "../components/navbar";

export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-52 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-10 w-40 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <div className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              {[80, 64, 72, 56, 60].map((w, i) => (
                <div key={i} className="space-y-2.5">
                  <div
                    className="h-3 animate-pulse rounded bg-gray-200"
                    style={{ width: `${w}%` }}
                  />
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-7 w-full animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              ))}
            </div>
          </aside>

          {/* Cards skeleton */}
          <main className="min-w-0 flex-1">
            {/* Spinner */}
            <div className="mb-6 flex items-center justify-center gap-3 py-4">
              <svg
                className="h-5 w-5 animate-spin text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-500">Loading live roles…</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white p-6 ring-1 ring-gray-200"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Title + bookmark */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
                  </div>
                  {/* Tags */}
                  <div className="mb-4 flex gap-1.5">
                    {[40, 64, 52].map((w, j) => (
                      <div
                        key={j}
                        className="h-5 animate-pulse rounded-md bg-gray-100"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  {/* Meta */}
                  <div className="flex gap-4">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
                  </div>
                  {/* Footer */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
