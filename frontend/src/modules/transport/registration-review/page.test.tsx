import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { ReviewPage } from "./page";
import { demoRegistrations, demoSchool } from "./demo";
import { PointLookup } from "./point-lookup";
import type { Stop } from "@/modules/planning/stops/contracts";

const school = {
    ...demoSchool,
    id: "11111111-1111-4111-8111-111111111111",
    code: "DEMO",
};
const admin = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Điều phối demo",
    email: "admin@example.org",
    role: "ADMIN",
    schoolId: school.id,
};
const ben = {
    id: "33333333-3333-4333-8333-333333333333",
    schoolId: school.id,
    code: "BEN",
    name: "Điểm Bến An",
    address: "12 đường Bến An",
    latitude: 10,
    longitude: 106,
    kind: "SERVICE_POINT",
    allowsPickup: true,
    allowsDropoff: true,
    status: "ACTIVE",
    accessNote: null,
    deletedAt: null,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
};
const park = {
    ...ben,
    id: "44444444-4444-4444-8444-444444444444",
    code: "CV",
    name: "Điểm Công viên",
    allowsPickup: false,
};
const happy = demoRegistrations.find((row) => row.student.code === "HS05")!;
const missing = demoRegistrations.find((row) =>
    row.days.some((day) => day.requestedStop?.code === "BK-DEMO"),
)!;

function mockApi({
    user = admin,
    context = school,
    points = () => [ben, park],
} = {}) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string, init: RequestInit) => {
            expect(init.method).toBe("GET");
            const { pathname } = new URL(input);
            if (pathname === "/api/auth/me") return Response.json({ user });
            if (pathname === "/api/school-context")
                return Response.json(context);
            if (pathname === "/api/bus-stops") {
                const data = points();
                return Response.json({
                    data,
                    metadata: {
                        currentPage: 1,
                        pageCount: 1,
                        totalCount: data.length,
                        previousPage: null,
                        nextPage: null,
                        isFirstPage: true,
                        isLastPage: true,
                    },
                });
            }
            throw new Error(`Unexpected API ${pathname}`);
        }),
    );
}

function show(props: Parameters<typeof ReviewPage>[0]) {
    return render(
        <SWRConfig
            value={{ provider: () => new Map(), shouldRetryOnError: false }}
        >
            <ReviewPage {...props} />
        </SWRConfig>,
    );
}

beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api");
    window.sessionStorage.clear();
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("dispatch review workspace", () => {
    it("refreshes an open lookup when eligible points change", async () => {
        vi.stubGlobal(
            "ResizeObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        const point: Stop = { ...ben, kind: "SERVICE_POINT", status: "ACTIVE" };
        const renderLookup = (catalogue: Stop[]) => (
            <SWRConfig
                value={{ provider: () => new Map(), shouldRetryOnError: false }}
            >
                <PointLookup
                    label="Điểm gán"
                    stop={null}
                    direction="DROPOFF"
                    catalogue={catalogue}
                    schoolId={school.id}
                    onChange={() => {}}
                />
            </SWRConfig>
        );
        const { rerender } = render(renderLookup([point]));
        fireEvent.click(screen.getByRole("button", { name: "Điểm gán" }));
        expect(
            await screen.findByRole("option", { name: /Điểm Bến An/ }),
        ).toBeInTheDocument();

        rerender(
            renderLookup([
                { ...point, name: "Bến An mới" },
                { ...point, id: park.id, code: park.code, name: park.name },
            ]),
        );
        expect(
            await screen.findByRole("option", { name: /Bến An mới/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("option", { name: /Điểm Công viên/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("option", { name: /Điểm Bến An/ }),
        ).not.toBeInTheDocument();
    });

    it("approves all dates and shows the decision in the approved list after reopening", async () => {
        mockApi();
        show({ id: happy.id });
        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "Duyệt đơn" }),
            ).toBeEnabled(),
        );
        fireEvent.click(screen.getByRole("button", { name: "Duyệt đơn" }));
        fireEvent.click(
            within(screen.getByRole("dialog")).getByRole("button", {
                name: "Xác nhận duyệt",
            }),
        );
        expect(
            await screen.findByRole("heading", { name: "Đã duyệt đăng ký" }),
        ).toBeInTheDocument();
        expect(screen.getByText(admin.name)).toBeInTheDocument();

        cleanup();
        show({ initialStatus: "APPROVED" });
        expect(
            await screen.findByRole("link", {
                name: "Xem chi tiết đăng ký của Hà Lê",
            }),
        ).toBeInTheDocument();
        fireEvent.change(
            screen.getByRole("textbox", {
                name: "Tìm theo tên hoặc mã học sinh",
            }),
            { target: { value: "ha le" } },
        );
        expect(
            screen.getByRole("link", {
                name: "Xem chi tiết đăng ký của Hà Lê",
            }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Chờ duyệt" }));
        expect(
            screen.queryByRole("link", {
                name: "Xem chi tiết đăng ký của Hà Lê",
            }),
        ).not.toBeInTheDocument();

        cleanup();
        mockApi({
            user: { ...admin, id: "55555555-5555-4555-8555-555555555555" },
        });
        show({ id: happy.id });
        expect(
            await screen.findByRole("button", { name: "Duyệt đơn" }),
        ).toBeInTheDocument();
    });

    it("matches a newly active catalogue point when returning to the same request", async () => {
        let status = "INACTIVE";
        mockApi({
            points: () => [
                ben,
                park,
                {
                    ...park,
                    id: "77777777-7777-4777-8777-777777777777",
                    code: "BK-DEMO",
                    name: "Điểm Bờ Kè",
                    status,
                },
            ],
        });
        show({ id: missing.id });
        expect(
            await screen.findByText(/đã ngừng hoạt động/),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Mở danh mục điểm" }),
        ).toHaveAttribute("href", "/admin/stops?registration=" + missing.id);
        expect(
            screen.getByRole("button", { name: "Duyệt đơn" }),
        ).toBeDisabled();
        cleanup();
        status = "ACTIVE";
        show({ id: missing.id });
        await waitFor(() =>
            expect(
                screen.getByRole("button", { name: "Duyệt đơn" }),
            ).toBeEnabled(),
        );
    });

    it("does not display the fixture to an admin from a different school", async () => {
        mockApi({ context: { ...school, name: "Trường khác" } });
        show({ initialStatus: "PENDING" });
        expect(
            await screen.findByText("Chức năng dành cho quản trị trường demo."),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
