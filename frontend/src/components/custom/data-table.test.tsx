import "@/lib/i18n";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";

afterEach(cleanup);
const props = {
  label: "Xe",
  empty: "Chưa có xe.",
  retry: vi.fn(),
  columns: [
    {
      header: "Số ghế",
      sortKey: "capacity",
      cell: (row: { id: string; capacity: number }) => row.capacity,
    },
  ],
};
it("keeps the current rows on a refresh failure and delegates sorting to the server query", () => {
  const onSort = vi.fn();
  render(
    <DataTable
      {...props}
      error={{ code: "NETWORK_ERROR" }}
      sort="-capacity"
      onSort={onSort}
      rows={[{ id: "bus", capacity: 0 }]}
    />,
  );
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getByRole("columnheader")).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  fireEvent.click(screen.getByRole("button", { name: "Số ghế" }));
  expect(onSort).toHaveBeenCalledWith("capacity");
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(props.retry).toHaveBeenCalledOnce();
});
it("clears an empty search and keeps the create action for a genuinely empty list", () => {
  const clear = vi.fn();
  const { rerender } = render(
    <DataTable {...props} clearFilters={clear} rows={[]} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));
  expect(clear).toHaveBeenCalledOnce();
  rerender(
    <DataTable {...props} rows={[]} emptyAction={<button>Thêm xe</button>} />,
  );
  expect(screen.getByText("Chưa có xe.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thêm xe" })).toBeInTheDocument();
});
