import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng hoạt động",
  AVAILABLE: "Sẵn sàng",
  UNAVAILABLE: "Không sẵn sàng",
  APPROVED: "Đã duyệt",
  DRAFT: "Bản nháp",
  INVITED: "Đã mời",
  LOCKED: "Đã khóa",
  PLANNED: "Đã lên lịch",
  COMPLETED: "Hoàn tất",
  OPEN: "Đang chạy",
  CANCELLED: "Đã hủy",
  SUPERSEDED: "Đã thay thế",
};
export function RecordStatus({ value }: { value: string }) {
  const tone = ["ACTIVE", "AVAILABLE", "APPROVED", "OPEN"].includes(value)
    ? "positive"
    : ["CANCELLED", "LOCKED"].includes(value)
      ? "negative"
      : "neutral";
  return (
    <Badge variant="outline" data-tone={tone} className="gw-status">
      {labels[value] ?? value}
    </Badge>
  );
}
