"use client";
import { DataTable } from "@/components/custom/data-table";
import { CheckField } from "@/components/custom/check-field";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState, type FormEvent } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "@/components/error-notice";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { getErrorMessage } from "@/lib/i18n";
import { callApi, parseInput } from "@/lib/http/contracts";
import { accountApi } from "@/modules/system/accounts/contracts";
import {
  studentApi,
  linkGuardianRequest,
  assignCardRequest,
  guardianSchema,
  cardSchema,
} from "./contracts";

export function StudentAccessPanel({ studentId, busy, setBusy }: { studentId: string; busy: boolean; setBusy: (value: boolean) => void }) {
  const { mutate: mutateCache } = useSWRConfig();
  const { data, error, mutate, isValidating } = useSWR(
    ["student-access", studentId],
    () => studentApi.get(studentId),
  );
  const [guardianId, setGuardianId] = useState(""),
    [relationship, setRelationship] = useState("");
  const [canTrack, setCanTrack] = useState(true),
    [canRequest, setCanRequest] = useState(true);
  const [cardUid, setCardUid] = useState(""),
    [technology, setTechnology] = useState("NFC");
  const [reason, setReason] = useState("");
  async function perform(action: () => Promise<unknown>) {
    if (busy || error) return;
    setBusy(true);
    try {
      await action();
      await Promise.all([mutate(), mutateCache(key => Array.isArray(key) && key[0] === "student", undefined)]);
      toast.success("Đã cập nhật liên kết.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function link(event: FormEvent) {
    event.preventDefault();
    void perform(() =>
      callApi(
        linkGuardianRequest(studentId, {
          guardianAccountId: guardianId,
          relationshipLabel: relationship.trim() || null,
          canTrack,
          canRequest,
        }),
        guardianSchema,
      ),
    );
  }
  function assign(event: FormEvent) {
    event.preventDefault();
    void perform(() =>
      callApi(
        assignCardRequest(studentId, { cardUid, technology }),
        cardSchema,
      ),
    );
  }
  async function close(kind: "guardians" | "cards", id: string) {
    const body = parseInput(
      z.object({ reason: z.string().trim().min(1) }).strict(),
      { reason },
    );
    const path =
      "/students/" +
      studentId +
      "/" +
      kind +
      "/" +
      id +
      (kind === "cards" ? "/revoke" : "/close");
    if (kind === "cards")
      await callApi({ path, method: "POST", body }, cardSchema);
    else await callApi({ path, method: "POST", body }, guardianSchema);
  }
  if (error && !data)
    return (
      <div>
        <ErrorNotice error={error} />
        <Button type="button" variant="outline" onClick={() => void mutate()}>
          Thử lại
        </Button>
      </div>
    );
  if (!data) return <p>Đang tải…</p>;
  return (
    <div className="space-y-6">
      <p role="status" className={busy ? "text-sm text-muted-foreground" : "sr-only"}>{busy ? "Đang cập nhật liên kết…" : ""}</p>
      <p className="font-medium">
        {data.fullName}{" "}
        <span className="text-muted-foreground">({data.studentCode})</span>
      </p>
      <label className="block space-y-2 text-sm">
        Lý do khi đóng quyền hoặc thu hồi thẻ
        <Input
          placeholder="Nhập lý do đóng quyền hoặc thu hồi thẻ"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <form onSubmit={link} className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Liên kết phụ huynh</h3>
        <fieldset disabled={Boolean(error) || busy} className="space-y-3">
          <PagedLookup
            cacheKey="parent-accounts"
            label="Phụ huynh"
            value={guardianId}
            onChange={setGuardianId}
            required
            load={(query) => accountApi.list({ ...query, role: "PARENT" })}
            describe={(row) => row.displayName + " · " + row.email}
          />
          <label className="block text-sm">
            Quan hệ với học sinh (tùy chọn)
            <Input
              aria-label="Quan hệ với học sinh"
              placeholder="Quan hệ với học sinh"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
            />
          </label>
          <label className="mr-4 inline-flex items-center gap-2 text-sm">
            <CheckField
              checked={canTrack}
              onCheckedChange={(value) => setCanTrack(value === true)}
            />
            Được theo dõi
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <CheckField
              checked={canRequest}
              onCheckedChange={(value) => setCanRequest(value === true)}
            />
            Được gửi yêu cầu
          </label>
          <Button type="submit" disabled={!guardianId}>
            Liên kết
          </Button>
        </fieldset>
      </form>
      <DataTable
        label="Liên kết phụ huynh"
        rows={data.guardians}
        error={error}
        retry={() => void mutate()}
        refreshing={isValidating}
        empty="Chưa liên kết phụ huynh."
        columns={[
          {
            header: "Phụ huynh",
            cell: (r) => (
              <>
                {r.guardian?.displayName ?? "Phụ huynh đã liên kết"}
                <small>{r.guardian?.email}</small>
                <small>{r.relationshipLabel}</small>
              </>
            ),
          },
          {
            header: "Quyền",
            cell: (r) => (
              <>
                Theo dõi: {r.canTrack ? "Có" : "Không"}
                <small>Gửi yêu cầu: {r.canRequest ? "Có" : "Không"}</small>
              </>
            ),
          },
          {
            header: "Hiệu lực",
            cell: (r) => (
              <>
                {new Date(r.effectiveFrom).toLocaleString()}
                <small>
                  {r.effectiveTo
                    ? new Date(r.effectiveTo).toLocaleString()
                    : "Đang hiệu lực"}
                </small>
              </>
            ),
          },
          {
            header: "Thao tác",
            cell: (r) =>
              r.effectiveTo ? (
                "Đã đóng"
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(error) || busy || !reason.trim()}
                  onClick={() => void perform(() => close("guardians", r.id))}
                >
                  Đóng quyền
                </Button>
              ),
          },
        ]}
      />
      <form onSubmit={assign} className="space-y-3 border-t pt-4">
        <h3 className="font-semibold">Gán thẻ RFID/NFC</h3>
        <p className="text-xs text-muted-foreground">
          Giữ nguyên các số 0 ở đầu UID.
        </p>
        <fieldset disabled={Boolean(error) || busy} className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            UID thẻ
            <Input
              aria-label="UID thẻ"
              placeholder="UID thẻ"
              value={cardUid}
              onChange={(event) => setCardUid(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            Công nghệ thẻ
            <ChoiceField
              aria-label="Công nghệ thẻ"
              value={technology}
              onValueChange={(value) => setTechnology(value)}
            >
              <Choice value="NFC">NFC</Choice>
              <Choice value="RFID">RFID</Choice>
            </ChoiceField>
          </label>
          <Button type="submit">Gán thẻ</Button>
        </fieldset>
      </form>
      <DataTable
        label="Thẻ học sinh"
        rows={data.cards}
        error={error}
        retry={() => void mutate()}
        refreshing={isValidating}
        empty="Chưa gán thẻ cho học sinh."
        columns={[
          { header: "UID thẻ", cell: (r) => r.cardUid },
          { header: "Công nghệ", cell: (r) => r.technology },
          {
            header: "Hiệu lực",
            cell: (r) => (
              <>
                {new Date(r.effectiveFrom).toLocaleString()}
                <small>
                  {r.effectiveTo
                    ? new Date(r.effectiveTo).toLocaleString()
                    : "Đang hiệu lực"}
                </small>
              </>
            ),
          },
          {
            header: "Thao tác",
            cell: (r) =>
              r.effectiveTo ? (
                "Đã thu hồi"
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(error) || busy || !reason.trim()}
                  onClick={() => void perform(() => close("cards", r.id))}
                >
                  Thu hồi
                </Button>
              ),
          },
        ]}
      />
    </div>
  );
}
