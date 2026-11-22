"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RoleBadge } from "@/components/custom/status-badge";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "@/components/error-notice";
import { FormDialog } from "@/components/custom/form-dialog";
import { getErrorMessage } from "@/lib/i18n";
import { callApi, listPath, pageSchema } from "@/lib/http/contracts";
import {
  onboardDriverRequest,
  driverInvitationSchema,
} from "@/modules/records/drivers/contracts";
import {
  accountApi,
  accountSchema,
  type Account,
  type Invitation,
} from "./contracts";
import { AccountForm } from "./form";
import { sanitizeSpreadsheetText } from "./export";
export function AccountsPage({
  schoolId,
  schoolName,
  onClose,
}: {
  schoolId?: string;
  schoolName?: string;
  onClose?: () => void;
}) {
  const { confirm, dialog } = useConfirmAction();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [deleted, setDeleted] = useState<"exclude" | "only">("exclude"),
    [role, setRole] = useState(""),
    [sort, setSort] = useState("-createdAt");
  const [editing, setEditing] = useState<Account>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [invitation, setInvitation] = useState<Invitation>();
  const { data, error, isValidating, mutate } = useSWR(
    ["accounts", schoolId, search, page, deleted, role, sort],
    () => accountApi.list({ search, page, deleted, role, sort }, schoolId),
  );
  async function submit(input: unknown, onboarding: boolean) {
    setBusy(true);
    try {
      if (editing) await accountApi.update(editing.id, input, schoolId);
      else
        setInvitation(
          onboarding
            ? await callApi(onboardDriverRequest(input), driverInvitationSchema)
            : await accountApi.create(input, schoolId),
        );
      await mutate();
      setOpen(false);
      toast.success("Đã lưu tài khoản.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function lifecycle(row: Account) {
    setBusy(true);
    try {
      if (row.deletedAt) await accountApi.restore(row.id, schoolId);
      else await accountApi.remove(row.id, schoolId);
      await mutate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function invite(row: Account) {
    setBusy(true);
    try {
      setInvitation(await accountApi.invite(row.id, schoolId));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function exportAccounts() {
    setBusy(true);
    try {
      const result = await callApi(
        {
          path: listPath("/users/export", { search, role, deleted, sort }),
          method: "GET",
        },
        pageSchema(accountSchema),
      );
      const rows = result.data.map((row) => ({
        id: sanitizeSpreadsheetText(row.id),
        displayName: sanitizeSpreadsheetText(row.displayName),
        email: sanitizeSpreadsheetText(row.email),
        role: row.role,
        phone: sanitizeSpreadsheetText(row.phone),
        status: row.status,
      }));
      const { default: writeExcelFile } =
        await import("write-excel-file/browser");
      await writeExcelFile(rows, {
        schema: [
          { column: "ID", type: String, value: (row) => row.id },
          { column: "Họ tên", type: String, value: (row) => row.displayName },
          { column: "Email", type: String, value: (row) => row.email },
          { column: "Vai trò", type: String, value: (row) => row.role },
          { column: "Điện thoại", type: String, value: (row) => row.phone },
          { column: "Trạng thái", type: String, value: (row) => row.status },
        ],
        fileName:
          "guardianway-accounts-" +
          new Date().toISOString().slice(0, 10) +
          ".xlsx",
      });
      toast.success("Đã xuất " + result.metadata.totalCount + " tài khoản.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const list = (
    <ListPage
      title={schoolId ? undefined : "Tài khoản"}
      actions={
        <div className="flex gap-2">
          {!schoolId ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void exportAccounts()}
            >
              Xuất Excel
            </Button>
          ) : null}
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            Thêm tài khoản
          </Button>
        </div>
      }
    >
      {invitation ? (
        <div
          role="status"
          className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm"
        >
          <p>
            Lời mời cho {invitation.account.email} · {invitation.deliveryStatus}
          </p>
          {invitation.deliveryStatus === "FAILED" ? (
            <ErrorNotice error={{ code: "INVITATION_DELIVERY_FAILED" }} />
          ) : null}
          <p>Hết hạn: {new Date(invitation.expiresAt).toLocaleString()}</p>
          <Input
            aria-label="Liên kết mời"
            readOnly
            value={invitation.inviteLink}
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setInvitation(undefined)}
          >
            Ẩn liên kết
          </Button>
        </div>
      ) : null}
      <div className="gw-filters">
        <Input
          aria-label="Tìm tài khoản"
          placeholder="Tìm tên hoặc email..."
          className="max-w-sm"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        {!schoolId ? (
          <ChoiceField
            aria-label="Lọc vai trò"
            value={role}
            onValueChange={(value) => {
              setRole(value);
              setPage(1);
            }}
          >
            <Choice value="">Tất cả vai trò</Choice>
            <Choice value="ADMIN">Quản trị trường</Choice>
            <Choice value="PARENT">Phụ huynh</Choice>
            <Choice value="DRIVER">Tài xế</Choice>
          </ChoiceField>
        ) : null}
        <ChoiceField
          aria-label="Tài khoản đã xóa"
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
        label="Tài khoản"
        empty="Chưa có tài khoản."
        rows={data?.data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        pagination={data?.metadata}
        onPage={setPage}
        pageSize={10}
        sort={sort}
        onSort={(field) => {
          setSort(sort === field ? "-" + field : field);
          setPage(1);
        }}
        clearFilters={
          search || deleted === "only" || role
            ? () => {
                setSearch("");
                setDeleted("exclude");
                setRole("");
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
            Thêm tài khoản
          </Button>
        }
        columns={[
          {
            header: "Họ tên",
            sortKey: "displayName",
            cell: (row) => row.displayName,
          },
          {
            header: "Email / điện thoại",
            cell: (row) => (
              <>
                {row.email}
                <p className="text-muted-foreground">{row.phone}</p>
              </>
            ),
          },
          { header: "Vai trò", cell: (row) => <RoleBadge role={row.role} /> },
          {
            header: "Trạng thái",
            cell: (row) => <RecordStatus value={row.status} />,
          },
          {
            header: "Thao tác",
            cell: (row) => (
              <>
                <div className="flex flex-wrap gap-2">
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
                        disabled={busy || row.status === "LOCKED"}
                        onClick={() => void invite(row)}
                      >
                        Cấp lại lời mời
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
                          (row.deletedAt ? "Khôi phục " : "Xóa ") +
                          row.displayName,
                        description: row.deletedAt
                          ? "Khôi phục tài khoản?"
                          : "Xóa mềm tài khoản? Email vẫn được giữ, không thể cấp lại cho tài khoản khác.",
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
    </ListPage>
  );
  const title = open
    ? editing
      ? "Sửa tài khoản"
      : "Thêm tài khoản"
    : "Quản trị viên — " + schoolName;
  return (
    <>
      {!schoolId && list}
      <FormDialog
        busy={busy}
        size={open ? "lg" : "xl"}
        isOpen={open || Boolean(schoolId)}
        onClose={() => (open ? setOpen(false) : onClose?.())}
        title={title}
      >
        {open ? (
          <AccountForm
            key={editing?.id ?? "new"}
            initialData={editing}
            platform={Boolean(schoolId)}
            busy={busy}
            onSubmit={submit}
            onCancel={() => setOpen(false)}
          />
        ) : (
          list
        )}
      </FormDialog>
      {dialog}
    </>
  );
}
