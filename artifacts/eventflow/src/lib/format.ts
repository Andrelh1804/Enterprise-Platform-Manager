export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  planning: "outline",
  confirmed: "default",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
  prospect: "outline",
  negotiating: "outline",
  delivered: "secondary",
  active: "default",
  inactive: "secondary",
  pending_review: "outline",
  draft: "outline",
  sent: "outline",
  signed: "default",
  expired: "destructive",
  scheduled: "outline",
  checked_in: "default",
  checked_out: "secondary",
  no_show: "destructive",
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  waitlist: "outline",
};
