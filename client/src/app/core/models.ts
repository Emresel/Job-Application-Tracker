export type Role = "Admin" | "Management" | "Regular" | "Control";

export interface Me {
  userID: number;
  name: string;
  email: string;
  role: Role;
  userTypes?: string | null;
}

export interface UserSummary extends Me {}

export interface Company {
  companyID: number;
  name: string;
  industry?: string | null;
  location?: string | null;
}

export interface Category {
  categoryID: number;
  name: string;
  description?: string | null;
  managerID: number;
  managerName?: string | null;
}

export interface ApplicationItem {
  appID: number;
  userID?: number;
  categoryID?: number | null;
  companyID?: number | null;
  company: string;
  position: string;
  status: string;
  priority?: number;
  appliedDate: string;
  deadline?: string | null;
  notes?: string | null;
}

export interface Paged<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface Reminder {
  reminderID: number;
  appID?: number | null;
  reminderDate: string;
  message: string;
}

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

