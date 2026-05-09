import type { Dictionary } from "@/lib/i18n";

export function userOrders(dictionary: Dictionary) {
  return [
    {
      id: "ORD-20260505-001",
      plan: dictionary.pricing.plans[1].label,
      amount: dictionary.pricing.plans[1].price,
      status: "paid",
      date: "2026-05-05"
    },
    {
      id: "ORD-20260405-004",
      plan: dictionary.pricing.plans[0].label,
      amount: dictionary.pricing.plans[0].price,
      status: "fulfilled",
      date: "2026-04-05"
    }
  ];
}

export function adminOrders(dictionary: Dictionary) {
  return [
    {
      id: "ORD-20260505-003",
      user: "tanaka@example.jp",
      plan: dictionary.pricing.plans[1].label,
      amount: dictionary.pricing.plans[1].price,
      status: "paid"
    },
    {
      id: "ORD-20260505-002",
      user: "li@example.com",
      plan: dictionary.pricing.plans[0].label,
      amount: dictionary.pricing.plans[0].price,
      status: "pending"
    },
    {
      id: "ORD-20260504-008",
      user: "ops@example.com",
      plan: dictionary.pricing.plans[2].label,
      amount: "custom",
      status: "fulfilled"
    }
  ];
}

export const inventoryRows = [
  {
    device: "JP-001",
    provider: "VMOSCloud",
    padCode: "PAD-JP-001",
    region: "Japan",
    status: "assigned",
    expires: "2026-06-05",
    vmosExpires: "2026-06-10"
  },
  {
    device: "JP-002",
    provider: "VMOSCloud",
    padCode: "PAD-JP-002",
    region: "Japan",
    status: "available",
    expires: "-",
    vmosExpires: "2026-06-10"
  },
  {
    device: "HK-003",
    provider: "VMOSCloud",
    padCode: "PAD-HK-003",
    region: "Hong Kong",
    status: "available",
    expires: "-",
    vmosExpires: "2026-06-12"
  }
];

export const usersRows = [
  {
    email: "tanaka@example.jp",
    name: "Tanaka",
    language: "ja",
    role: "user",
    status: "active",
    passwordStatus: "encrypted",
    createdAt: "2026-05-01 10:24",
    lastLoginAt: "2026-05-05 09:18",
    lastLoginIp: "203.0.113.24"
  },
  {
    email: "li@example.com",
    name: "Li",
    language: "zh",
    role: "user",
    status: "active",
    passwordStatus: "encrypted",
    createdAt: "2026-05-02 14:06",
    lastLoginAt: "2026-05-04 22:40",
    lastLoginIp: "198.51.100.18"
  },
  {
    email: "admin@example.com",
    name: "Admin",
    language: "ja",
    role: "admin",
    status: "active",
    passwordStatus: "encrypted",
    createdAt: "2026-04-28 08:00",
    lastLoginAt: "2026-05-05 11:02",
    lastLoginIp: "192.0.2.9"
  }
];

export const assignmentRows = [
  {
    id: "ASN-001",
    user: "tanaka@example.jp",
    device: "JP-001",
    padCode: "PAD-JP-001",
    order: "ORD-20260505-001",
    expires: "2026-06-05"
  }
];

export const ticketRows = [
  { id: "SUP-1024", user: "tanaka@example.jp", title: "Login issue", status: "open", updated: "2026-05-05" },
  { id: "SUP-1023", user: "li@example.com", title: "Renewal question", status: "replied", updated: "2026-05-04" }
];
