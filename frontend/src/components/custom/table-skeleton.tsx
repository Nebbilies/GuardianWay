import {Skeleton} from '@/components/ui/skeleton'

interface TableSkeletonProps {
    columns: number
    rows?: number
}

// Mirrors the admin table shell (bordered, muted header) so the loading state
// occupies the same footprint as the loaded table instead of a text placeholder.
export default function TableSkeleton({columns, rows = 6}: TableSkeletonProps) {
    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex gap-6 border-b border-border bg-muted px-6 py-3.5">
                {Array.from({length: columns}).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1"/>
                ))}
            </div>
            {Array.from({length: rows}).map((_, r) => (
                <div key={r} className="flex items-center gap-6 border-b border-border px-6 py-4 last:border-b-0">
                    {Array.from({length: columns}).map((_, c) => (
                        <Skeleton key={c} className="h-4 flex-1"/>
                    ))}
                </div>
            ))}
        </div>
    )
}
