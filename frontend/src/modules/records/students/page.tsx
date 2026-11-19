"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/i18n";
import { FormDialog } from "@/components/custom/form-dialog";
import { studentApi, type Student } from "./contracts";
import { StudentForm } from "./form";
import { StudentAccessPanel } from "./access-panel";
export function StudentPage() {
  const { confirm, dialog } = useConfirmAction();
  const { mutate: mutateCache } = useSWRConfig();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [deleted, setDeleted] = useState<"exclude" | "only">("exclude"),
    [sort, setSort] = useState("-createdAt");
  const [editing, setEditing] = useState<Student>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const [accessId, setAccessId] = useState<string>();
  const { data, error, isValidating, mutate } = useSWR(
    ["student", search, page, deleted, sort],
    () => studentApi.list({ search, page, deleted, sort }),
  );
  async function submit(input: unknown) {
    setBusy(true);
    try {
      if (editing) await studentApi.update(editing.id, input);
      else await studentApi.create(input);
      await mutate();
      setOpen(false);
      toast.success("Đã lưu dữ liệu.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function lifecycle(row: Student) {
    setBusy(true);
    try {
      if (row.deletedAt) await studentApi.restore(row.id);
      else await studentApi.remove(row.id);
      await mutateCache(
        (key) => Array.isArray(key) && key[0] === "student",
        undefined,
      );
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
      title={<>Học sinh</>}
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
          aria-label="Tìm học sinh"
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
        label="Học sinh"
        empty="Chưa có học sinh."
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
          {
            header: "Mã học sinh",
            sortKey: "studentCode",
            cell: (row) => row.studentCode ?? "—",
          },
          {
            header: "Họ tên",
            sortKey: "fullName",
            cell: (row) => row.fullName ?? "—",
          },
          { header: "Lớp", cell: (row) => row.classLabel ?? "—" },
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
                  {!row.deletedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAccessId(row.id)}
                    >
                      Thẻ / Phụ huynh
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
                          row.fullName,
                        description: row.deletedAt
                          ? "Khôi phục hồ sơ. Quyền phụ huynh và thẻ cần được gán lại."
                          : "Xóa học sinh sẽ đóng các liên kết phụ huynh và gán thẻ đang hiệu lực.",
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
        title={editing ? "Sửa học sinh" : "Thêm học sinh"}
      >
        <StudentForm
          key={editing?.id ?? "new"}
          initialData={editing}
          busy={busy}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormDialog>
      {accessId ? (
        <FormDialog
          size="lg"
          isOpen
          onClose={() => setAccessId(undefined)}
          title="Phụ huynh và thẻ học sinh"
        >
          <StudentAccessPanel studentId={accessId} />
        </FormDialog>
      ) : null}
      {dialog}
    </ListPage>
  );
}
