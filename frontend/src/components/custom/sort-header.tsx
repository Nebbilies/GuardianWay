import {ArrowUpDown} from 'lucide-react'

interface SortHeaderProps {
    label: string
    sortKeyValue: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    onSortChange: (sortBy: string) => void
}

export function SortHeader({label, sortKeyValue, sortBy, sortOrder, onSortChange}: SortHeaderProps) {
    return (
        <button
            onClick={() => onSortChange(sortKeyValue)}
            className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors"
        >
            {label}
            {sortBy === sortKeyValue && (
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}/>
            )}
        </button>
    )
}
