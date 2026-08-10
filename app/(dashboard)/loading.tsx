/**
 * Instant fallback for every route in the dashboard group.
 *
 * Without it, tapping a nav item does nothing visible until the server
 * component finishes fetching - on a phone that reads as "did my tap even
 * register?". Next swaps this in the moment navigation starts.
 */
export default function DashboardLoading() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading…</span>

            {/* Month picker / page header */}
            <div className="h-16 rounded-2xl bg-muted" />

            {/* Summary tiles */}
            {/* Same breakpoints as the real metric cards, so nothing jumps. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted" />
                ))}
            </div>

            {/* Content cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 rounded-xl bg-muted md:col-span-2" />
                <div className="h-48 rounded-xl bg-muted" />
                <div className="h-48 rounded-xl bg-muted" />
            </div>
        </div>
    )
}
