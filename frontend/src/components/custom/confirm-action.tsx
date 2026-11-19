"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Confirmation {
  title: string;
  description: string;
  action: string;
  destructive?: boolean;
  run: () => Promise<void>;
}
export function useConfirmAction() {
  const { t } = useTranslation();
  const [request, confirm] = useState<Confirmation>();
  const [pending, setPending] = useState(false);
  async function submit() {
    if (!request || pending) return;
    setPending(true);
    try {
      await request.run();
      confirm(undefined);
    } finally {
      setPending(false);
    }
  }
  const dialog = (
    <AlertDialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open && !pending) confirm(undefined);
      }}
    >
      <AlertDialogContent className="overflow-hidden p-0">
        <div className="gw-dialog-heading">
          <AlertDialogTitle className="text-2xl font-bold">
            {request?.title}
          </AlertDialogTitle>
        </div>
        <AlertDialogDescription className="px-6">
          {request?.description}
        </AlertDialogDescription>
        <div className="gw-form-actions">
          <AlertDialogCancel disabled={pending}>
            {t("controls.back")}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={pending}
            variant={request?.destructive ? "destructive" : "default"}
            onClick={() => void submit()}
          >
            {request?.action}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm, dialog };
}
