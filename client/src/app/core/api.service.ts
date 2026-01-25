import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
  ApplicationItem,
  Category,
  Company,
  Paged,
  Reminder,
  StatusBreakdownItem,
  TimeseriesPoint,
  UserSummary,
} from "./models";

const API = "/api/v1";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  dashboard() {
    return firstValueFrom(
      this.http.get<{
        totalApplications: number;
        interviewsScheduled: number;
        offersReceived: number;
        rejections: number;
        scope: string;
      }>(`${API}/dashboard`),
    );
  }

  timeseries(from: string, to: string) {
    const params = new HttpParams().set("from", from).set("to", to);
    return firstValueFrom(this.http.get<TimeseriesPoint[]>(`${API}/dashboard/timeseries`, { params }));
  }

  statusBreakdown() {
    return firstValueFrom(this.http.get<StatusBreakdownItem[]>(`${API}/dashboard/status-breakdown`));
  }

  companies() {
    return firstValueFrom(this.http.get<Company[]>(`${API}/companies`));
  }

  createCompany(payload: { name: string; industry?: string; location?: string }) {
    return firstValueFrom(this.http.post(`${API}/companies`, payload));
  }

  categories() {
    return firstValueFrom(this.http.get<Category[]>(`${API}/categories`));
  }

  createCategory(payload: { name: string; description?: string; managerID: number }) {
    return firstValueFrom(this.http.post(`${API}/categories`, payload));
  }

  applications(opts: { status?: string; q?: string; page?: number; pageSize?: number } = {}) {
    let params = new HttpParams();
    if (opts.status) params = params.set("status", opts.status);
    if (opts.q) params = params.set("q", opts.q);
    if (opts.page) params = params.set("page", String(opts.page));
    if (opts.pageSize) params = params.set("pageSize", String(opts.pageSize));
    // Note: guest preview returns an array; signed-in returns a paged object.
    return firstValueFrom(this.http.get<Paged<ApplicationItem> | ApplicationItem[]>(`${API}/applications`, { params }));
  }

  createApplication(payload: {
    companyID?: number;
    company?: string;
    position: string;
    status: string;
    appliedDate: string;
    notes?: string;
    categoryID?: number;
    priority?: number;
    deadline?: string;
  }) {
    return firstValueFrom(this.http.post(`${API}/applications`, payload));
  }

  updateApplication(
    id: number,
    payload: Partial<Pick<ApplicationItem, "status" | "priority" | "deadline" | "categoryID" | "notes">>,
  ) {
    return firstValueFrom(this.http.put(`${API}/applications/${id}`, payload));
  }

  deleteApplication(id: number) {
    return firstValueFrom(this.http.delete(`${API}/applications/${id}`));
  }

  reminders() {
    return firstValueFrom(this.http.get<Reminder[]>(`${API}/reminders`));
  }

  createReminder(payload: { appID?: number; reminderDate: string; message: string }) {
    return firstValueFrom(this.http.post(`${API}/reminders`, payload));
  }

  deleteReminder(id: number) {
    return firstValueFrom(this.http.delete(`${API}/reminders/${id}`));
  }

  users() {
    return firstValueFrom(this.http.get<UserSummary[]>(`${API}/users`));
  }

  updateUser(id: number, payload: { role: string; userTypes?: string | null }) {
    return firstValueFrom(this.http.put(`${API}/users/${id}`, payload));
  }
}

