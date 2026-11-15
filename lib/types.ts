export type Role = "manager" | "warden";

export type User = { id: number; username: string; name: string; role: Role };

export type Student = { id: number; name: string; dob: string; class_name: string; room: string };

export type AbsenceReason = { id: number; name: string; is_medical: number };
export type Illness = { id: number; name: string };

export type AttendanceStatus = "present" | "absent";

export type Item = {
  id: number;
  name: string;
  category: "Food" | "Medicine" | "Hygiene" | "Stationery";
  unit: string;
  min_level: number;
  balance: number;
};

export type AlertRule = "repeated_illness" | "low_attendance" | "low_stock" | "expiring_stock";
export type Severity = "critical" | "warning";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export type Alert = {
  id: number;
  rule: AlertRule;
  severity: Severity;
  student_id: number | null;
  item_id: number | null;
  message: string;
  dedupe_key: string;
  trigger_date: string;
  status: AlertStatus;
  created_at: string;
  resolved_at: string | null;
};

export const CASE_STATUSES = ["open", "scheduled", "under_treatment", "resolved"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  open: "Open",
  scheduled: "Scheduled",
  under_treatment: "Under treatment",
  resolved: "Resolved",
};

export const RULE_LABEL: Record<AlertRule, string> = {
  repeated_illness: "Repeated illness",
  low_attendance: "Low attendance",
  low_stock: "Low stock",
  expiring_stock: "Expiring stock",
};
