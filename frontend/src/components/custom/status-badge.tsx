import {Badge} from '@/components/ui/badge'
import {BusStatus, BusTripStatus, Role, TripType} from '@/types/types'

// Muted, theme-aware status tones. Backgrounds sit at low opacity so they read
// on both the warm light surface and the dark surface; text carries the hue.
type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'sky' | 'violet'

const toneClass: Record<Tone, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    warning: 'bg-amber-500/12 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    neutral: 'bg-muted text-muted-foreground',
    info: 'bg-primary/10 text-primary',
    sky: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
    violet: 'bg-violet-500/10 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
}

function ToneBadge({tone, children}: { tone: Tone; children: React.ReactNode }) {
    return <Badge className={toneClass[tone]}>{children}</Badge>
}

const busStatus: Record<BusStatus, { tone: Tone; label: string }> = {
    ACTIVE: {tone: 'success', label: 'Đang hoạt động'},
    MAINTENANCE: {tone: 'warning', label: 'Đang bảo trì'},
    RETIRED: {tone: 'neutral', label: 'Ngừng hoạt động'},
}

export function BusStatusBadge({status}: { status: BusStatus }) {
    const {tone, label} = busStatus[status]
    return <ToneBadge tone={tone}>{label}</ToneBadge>
}

const tripStatus: Record<BusTripStatus, { tone: Tone; label: string }> = {
    SCHEDULED: {tone: 'info', label: 'Đã lên lịch'},
    IN_PROGRESS: {tone: 'success', label: 'Đang chạy'},
    COMPLETED: {tone: 'neutral', label: 'Hoàn thành'},
    CANCELLED: {tone: 'danger', label: 'Đã hủy'},
}

export function TripStatusBadge({status}: { status: BusTripStatus }) {
    const {tone, label} = tripStatus[status]
    return <ToneBadge tone={tone}>{label}</ToneBadge>
}

const tripType: Record<TripType, { tone: Tone; label: string }> = {
    PICKUP: {tone: 'sky', label: 'Đón'},
    DROPOFF: {tone: 'violet', label: 'Trả'},
}

export function TripTypeBadge({type}: { type: TripType }) {
    const {tone, label} = tripType[type]
    return <ToneBadge tone={tone}>{label}</ToneBadge>
}

const role: Record<Role, { tone: Tone; label: string }> = {
    SUPER_ADMIN: {tone: 'info', label: 'Quản trị hệ thống'},
    ADMIN: {tone: 'info', label: 'Quản trị viên'},
    DRIVER: {tone: 'sky', label: 'Tài xế'},
    PARENT: {tone: 'neutral', label: 'Phụ huynh'},
}

export function RoleBadge({role: value}: { role: Role }) {
    const entry = role[value]
    if (!entry) return <ToneBadge tone="neutral">{value}</ToneBadge>
    return <ToneBadge tone={entry.tone}>{entry.label}</ToneBadge>
}

export function CardStatusBadge({assigned}: { assigned: boolean }) {
    return assigned
        ? <ToneBadge tone="success">Đã gán</ToneBadge>
        : <Badge variant="outline" className="text-muted-foreground">Chưa gán</Badge>
}

export function SchoolStatusBadge({ isActive, deleted }: { isActive: boolean; deleted?: boolean }) {
    if (deleted) return <ToneBadge tone="danger">Đã xóa</ToneBadge>
    return isActive
        ? <ToneBadge tone="success">Đang hoạt động</ToneBadge>
        : <ToneBadge tone="neutral">Tạm ngưng</ToneBadge>
}
