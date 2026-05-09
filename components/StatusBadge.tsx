const variants: Record<string, string> = {
  active: "",
  assigned: "",
  available: "",
  "已付款": "",
  "已分配": "",
  "已开通": "",
  "已回复": "blue",
  "已暂停": "danger",
  "待付款": "amber",
  "待回复": "amber",
  "空闲": "blue",
  "正常": "",
  fulfilled: "",
  paid: "",
  open: "amber",
  pending: "amber",
  replied: "blue",
  suspended: "danger"
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${variants[status] ?? "blue"}`}>{status}</span>;
}
