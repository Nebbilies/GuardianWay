"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/i18n";
import { FormDialog } from "@/components/custom/form-dialog";
import { vehicleApi, type Vehicle } from "./contracts";
import { VehicleForm } from "./form";
export function VehiclePage() {
  const { confirm, dialog } = useConfirmAction();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [deleted, setDeleted] = useState<"exclude" | "only">("exclude"),
    [sort, setSort] = useState("-createdAt");
  const [editing, setEditing] = useState<Vehicle>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const { data, error, isValidating, mutate } = useSWR(
    ["vehicle", search, page, deleted, sort],
    () => vehicleApi.list({ search, page, deleted, sort }),
  );
  async function submit(input: unknown) {
    setBusy(true);
    try {
      if (editing) await vehicleApi.update(editing.id, input);
      else await vehicleApi.create(input);
      await mutate();
      setOpen(false);
      toast.success("Đã lưu dữ liệu.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function lifecycle(row: Vehicle) {
    setBusy(true);
    try {
      if (row.deletedAt) await vehicleApi.restore(row.id);
      else await vehicleApi.remove(row.id);
      await mutate();
      toast.success("Đã cập nhật hồ sơ.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function changeSort(field: string) {
    setSort(sort === field ? "-" + field : field);
    setPage(1);
  }
  return (
    <ListPage
      title={<>Xe buýt</>}
      actions={
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Thêm mới
        </Button>
      }
    >
      <div className="gw-filters">
        <Input
          aria-label="Tìm xe"
          placeholder="Tìm kiếm..."
          className="max-w-sm"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <ChoiceField
          aria-label="Hồ sơ đã xóa"
          value={deleted}
          onValueChange={(value) => {
            setDeleted(value === "only" ? "only" : "exclude");
            setPage(1);
          }}
        >
          <Choice value="exclude">Chưa xóa</Choice>
          <Choice value="only">Đã xóa</Choice>
        </ChoiceField>
      </div>
      <DataTable
        label="Xe buýt"
        empty="Chưa có xe buýt."
        rows={data?.data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        pagination={data?.metadata}
        onPage={setPage}
        pageSize={10}
        sort={sort}
        onSort={changeSort}
        clearFilters={
          search || deleted === "only"
            ? () => {
                setSearch("");
                setDeleted("exclude");
                setPage(1);
              }
            : undefined
        }
        emptyAction={
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Thêm mới
          </Button>
        }
        columns={[
          { header: "Mã xe", sortKey: "code", cell: (row) => row.code ?? "—" },
          {
            header: "Biển số",
            sortKey: "plateNumber",
            cell: (row) => row.plateNumber ?? "—",
          },
          {
            header: "Sức chứa học sinh",
            numeric: true,
            cell: (row) => row.studentCapacity ?? "—",
          },
          {
            header: "Trạng thái",
            sortKey: "status",
            cell: (row) => <RecordStatus value={row.status} />,
          },
          {
            header: "Thao tác",
            cell: (row) => (
              <>
                <div className="flex flex-wrap gap-2">
                  {!row.deletedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditing(row);
                        setOpen(true);
                      }}
                    >
                      Sửa
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      confirm({
                        title:
                          (row.deletedAt ? "Khôi phục " : "Xóa ") +
                          row.plateNumber,
                        description: row.deletedAt
                          ? "Khôi phục hồ sơ này?"
                          : "Xóa mềm hồ sơ này?",
                        action: row.deletedAt ? "Khôi phục" : "Xóa",
                        destructive: !row.deletedAt,
                        run: () => lifecycle(row),
                      })
                    }
                  >
                    {row.deletedAt ? "Khôi phục" : "Xóa"}
                  </Button>
                </div>
              </>
            ),
          },
        ]}
      />
      <FormDialog
        busy={busy}
        size="md"
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa xe" : "Thêm xe"}
      >
        <VehicleForm
          key={editing?.id ?? "new"}
          initialData={editing}
          busy={busy}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormDialog>
      {dialog}
    </ListPage>
  );
}
