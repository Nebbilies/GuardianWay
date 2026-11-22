"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/i18n";
import { FormDialog } from "@/components/custom/form-dialog";
import { AccountsPage } from "@/modules/system/accounts/page";
import { schoolApi, type School } from "./contracts";
import { SchoolForm } from "./form";
export function SchoolsPage() {
  const { confirm, dialog } = useConfirmAction();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [deleted, setDeleted] = useState<"exclude" | "only">("exclude");
  const [editing, setEditing] = useState<School>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [admins, setAdmins] = useState<School>();
  const { data, error, isValidating, mutate } = useSWR(
    ["schools", search, page, deleted],
    () => schoolApi.list({ search, page, deleted }),
  );
  async function submit(input: unknown) {
    setBusy(true);
    try {
      if (editing) await schoolApi.update(editing.id, input);
      else await schoolApi.create(input);
      await mutate();
      setOpen(false);
      toast.success("Đã lưu trường.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function lifecycle(row: School) {
    setBusy(true);
    try {
      if (row.deletedAt) await schoolApi.restore(row.id);
      else await schoolApi.remove(row.id);
      await mutate();
      toast.success("Đã cập nhật trường.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ListPage
      title={<>Trường học</>}
      actions={
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          Thêm trường
        </Button>
      }
    >
      <div className="gw-filters">
        <Input
          aria-label="Tìm trường"
          placeholder="Tìm trường..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <ChoiceField
          aria-label="Trường đã xóa"
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
        label="Trường học"
        empty="Chưa có trường học."
        rows={data?.data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        pagination={data?.metadata}
        onPage={setPage}
        pageSize={10}
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
            Thêm trường
          </Button>
        }
        columns={[
          { header: "Mã", cell: (row) => row.code },
          {
            header: "Tên / liên hệ",
            cell: (row) => (
              <>
                {row.name}
                <p className="text-muted-foreground">{row.address}</p>
                <p className="text-muted-foreground">
                  {row.contactPhone} {row.contactEmail}
                </p>
              </>
            ),
          },
          { header: "Múi giờ", cell: (row) => row.timezone },
          {
            header: "Trạng thái",
            cell: (row) => <RecordStatus value={row.status} />,
          },
          {
            header: "Thao tác",
            cell: (row) => (
              <>
                <div className="flex gap-2">
                  {!row.deletedAt ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setEditing(row);
                          setOpen(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdmins(row)}
                      >
                        Quản trị viên
                      </Button>
                    </>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      confirm({
                        title:
                          (row.deletedAt ? "Khôi phục " : "Xóa ") + row.name,
                        description: row.deletedAt
                          ? "Khôi phục trường?"
                          : "Xóa mềm trường? Đăng nhập và refresh của tài khoản thuộc trường sẽ bị chặn.",
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
        size="lg"
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa trường" : "Thêm trường"}
      >
        <SchoolForm
          key={editing?.id ?? "new"}
          initialData={editing}
          busy={busy}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormDialog>
      {admins ? (
        <AccountsPage
          schoolId={admins.id}
          schoolName={admins.name}
          onClose={() => setAdmins(undefined)}
        />
      ) : null}
      {dialog}
    </ListPage>
  );
}
