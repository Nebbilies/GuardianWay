import { PagedLookup } from "@/components/custom/paged-lookup";
import type { Stop } from "@/modules/planning/stops/contracts";
import { eligibleStop, paginate, searchText, type DayGroup } from "./review";

export function PointLookup({
    label,
    stop,
    direction,
    catalogue,
    schoolId,
    onChange,
}: {
    label: string;
    stop: Stop | null;
    direction: DayGroup["direction"];
    catalogue: Stop[];
    schoolId: string;
    onChange: (id: string | null) => void;
}) {
    return (
        <PagedLookup<Stop>
            cacheKey={`review-points:${schoolId}:${direction}`}
            label={label}
            value={stop?.id ?? ""}
            selectedLabel={stop?.name}
            describe={(point) => point.name}
            renderOption={(point) => (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <span className="min-w-0">
                        <span className="block break-words font-medium">
                            {point.name}
                        </span>
                        <span className="block break-words text-xs text-muted-foreground">
                            {point.address}
                        </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        {point.code}
                    </span>
                </span>
            )}
            load={async ({ search = "", page = 1, limit = 10 }) => {
                const term = searchText(search);
                return paginate(
                    catalogue.filter(
                        (point) =>
                            eligibleStop(point, direction) &&
                            (!term ||
                                searchText(point.name).includes(term) ||
                                searchText(point.code).includes(term)),
                    ),
                    page,
                    limit,
                );
            }}
            onChange={(id) => {
                if (
                    !id ||
                    catalogue.some(
                        (point) =>
                            point.id === id && eligibleStop(point, direction),
                    )
                )
                    onChange(id || null);
            }}
        />
    );
}
