import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  busy?: boolean;
  children: ReactNode;
}
export function FormDialog({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  busy,
  children,
}: Props) {
  const { t } = useTranslation();
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="gw-dialog"
        data-size={size}
        showCloseButton={false}
        {...(!description ? { "aria-describedby": undefined } : {})}
        onOpenAutoFocus={() => {
          opener.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          if (opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        <header className="gw-dialog-heading">
          <DialogTitle className="min-w-0 break-words text-2xl leading-8 font-bold">
            {title}
          </DialogTitle>
          <DialogClose
            disabled={busy}
            className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-black/10"
            aria-label={t("controls.close")}
          >
            <X size={21} />
          </DialogClose>
        </header>
        <div className="gw-dialog-body">
          {description && <DialogDescription>{description}</DialogDescription>}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
