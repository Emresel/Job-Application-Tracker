import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/api.service";
import { AuthService } from "../../core/auth.service";
import { ApplicationItem, Paged } from "../../core/models";

@Component({
  selector: "app-applications",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Applications</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
        <button class="btn ghost" type="button" (click)="exportCsv()" [disabled]="!auth.isSignedIn()">
          Export CSV
        </button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Create Application</div>
        <div class="muted" style="font-size: 12px">
          Requires sign-in (JobSeeker / Admin / Management). Guest users can only view previews.
        </div>
      </div>

      <form class="form" [formGroup]="createForm" (ngSubmit)="create()">
        <div class="grid">
          <label class="field">
            <span>Company ID (optional)</span>
            <input type="number" formControlName="companyID" placeholder="2" />
          </label>
          <label class="field">
            <span>Company (if no Company ID)</span>
            <input type="text" formControlName="company" placeholder="Microsoft" />
          </label>
          <label class="field">
            <span>Position</span>
            <input type="text" formControlName="position" placeholder="Backend Developer" />
          </label>
          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </select>
          </label>
          <label class="field">
            <span>Applied Date</span>
            <input type="date" formControlName="appliedDate" />
          </label>
          <label class="field">
            <span>Priority</span>
            <input type="number" formControlName="priority" />
          </label>
          <label class="field">
            <span>Deadline</span>
            <input type="date" formControlName="deadline" />
          </label>
          <label class="field">
            <span>Category ID</span>
            <input type="number" formControlName="categoryID" placeholder="1" />
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <input type="text" formControlName="notes" placeholder="Sent via LinkedIn" />
        </label>

        <div class="row-actions">
          <button class="btn primary" type="submit">Create</button>
          <div class="muted" style="font-size: 12px" *ngIf="message()">{{ message() }}</div>
        </div>
      </form>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>List</div>
        <div class="muted" style="font-size: 12px">{{ meta() }}</div>
      </div>

      <form class="apps-filter" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
        <label class="field">
          <span>Status</span>
          <select formControlName="status">
            <option value="">(all)</option>
            <option>Applied</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Accepted</option>
            <option>Rejected</option>
          </select>
        </label>
        <label class="field">
          <span>Search</span>
          <input type="text" formControlName="q" placeholder="company/position..." />
        </label>
        <button class="btn" type="submit">Apply</button>
        <button class="btn ghost" type="button" (click)="prev()" [disabled]="!canPrev()">Prev</button>
        <button class="btn ghost" type="button" (click)="next()" [disabled]="!canNext()">Next</button>
      </form>

      <div class="table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Position</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th>Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of items()">
              <td>{{ a.appID }}</td>
              <td>{{ a.company }}</td>
              <td>{{ a.position }}</td>
              <td>{{ a.status }}</td>
              <td>{{ a.appliedDate }}</td>
              <td>{{ a.priority ?? 0 }}</td>
              <td>
                <button class="btn ghost" type="button" (click)="select(a)" [disabled]="!auth.isSignedIn()">
                  Edit
                </button>
                <button class="btn ghost" type="button" (click)="remove(a)" [disabled]="!auth.isSignedIn()">
                  Delete
                </button>
              </td>
            </tr>
            <tr *ngIf="!items().length">
              <td colspan="7" class="muted">No data.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>

    <div class="panel" *ngIf="selected() as s">
      <div class="panel-title">
        <div>Edit Application</div>
        <div class="muted" style="font-size: 12px">#{{ s.appID }} • {{ s.company }} • {{ s.position }}</div>
      </div>
      <form class="form" [formGroup]="editForm" (ngSubmit)="save()">
        <div class="grid">
          <label class="field">
            <span>Status</span>
            <select formControlName="status">
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Accepted</option>
              <option>Rejected</option>
            </select>
          </label>
          <label class="field">
            <span>Priority</span>
            <input type="number" formControlName="priority" />
          </label>
          <label class="field">
            <span>Deadline</span>
            <input type="date" formControlName="deadline" />
          </label>
          <label class="field">
            <span>Category ID</span>
            <input type="number" formControlName="categoryID" />
          </label>
        </div>
        <label class="field">
          <span>Notes</span>
          <input type="text" formControlName="notes" />
        </label>
        <div class="row-actions">
          <button class="btn primary" type="submit">Save</button>
          <button class="btn ghost" type="button" (click)="clear()">Cancel</button>
        </div>
      </form>
    </div>
  `,
})
export class ApplicationsComponent {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly http = inject(HttpClient);

  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly items = signal<ApplicationItem[]>([]);
  readonly meta = signal<string>("Loading...");

  readonly page = signal(1);
  readonly pageSize = 10;
  readonly total = signal<number | null>(null);

  readonly selected = signal<ApplicationItem | null>(null);

  readonly filterForm = new FormGroup({
    status: new FormControl("", { nonNullable: true }),
    q: new FormControl("", { nonNullable: true }),
  });

  readonly createForm = new FormGroup({
    companyID: new FormControl<number | null>(null),
    company: new FormControl("", { nonNullable: true }),
    position: new FormControl("", { nonNullable: true }),
    status: new FormControl("Applied", { nonNullable: true }),
    appliedDate: new FormControl("2025-01-20", { nonNullable: true }),
    priority: new FormControl<number | null>(0),
    deadline: new FormControl("", { nonNullable: true }),
    categoryID: new FormControl<number | null>(null),
    notes: new FormControl("", { nonNullable: true }),
  });

  readonly editForm = new FormGroup({
    status: new FormControl("Applied", { nonNullable: true }),
    priority: new FormControl<number | null>(0),
    deadline: new FormControl("", { nonNullable: true }),
    categoryID: new FormControl<number | null>(null),
    notes: new FormControl("", { nonNullable: true }),
  });

  constructor() {
    void this.load();
  }

  canPrev() {
    return this.total() !== null && this.page() > 1;
  }
  canNext() {
    const total = this.total();
    if (total === null) return false;
    return this.page() * this.pageSize < total;
  }

  async applyFilters() {
    this.page.set(1);
    await this.load();
  }

  async prev() {
    this.page.set(Math.max(1, this.page() - 1));
    await this.load();
  }

  async next() {
    this.page.set(this.page() + 1);
    await this.load();
  }

  async load() {
    this.error.set(null);
    try {
      const { status, q } = this.filterForm.getRawValue();
      const data = await this.api.applications({ status: status || undefined, q: q || undefined, page: this.page(), pageSize: this.pageSize });
      if (Array.isArray(data)) {
        // Guest preview
        this.total.set(null);
        this.items.set(data);
        this.meta.set("Guest preview");
      } else {
        const paged = data as Paged<ApplicationItem>;
        this.total.set(paged.total);
        this.items.set(paged.items);
        this.meta.set(`Page ${paged.page} • ${paged.items.length} shown • ${paged.total} total`);
      }
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load applications.");
      this.items.set([]);
      this.meta.set("Error");
    }
  }

  async create() {
    this.message.set(null);
    this.error.set(null);
    try {
      const v = this.createForm.getRawValue();
      await this.api.createApplication({
        companyID: v.companyID ?? undefined,
        company: v.company || undefined,
        position: v.position,
        status: v.status,
        appliedDate: v.appliedDate,
        priority: v.priority ?? undefined,
        deadline: v.deadline || undefined,
        categoryID: v.categoryID ?? undefined,
        notes: v.notes || undefined,
      });
      this.message.set("Application created.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to create application.");
    }
  }

  select(a: ApplicationItem) {
    this.selected.set(a);
    this.editForm.patchValue({
      status: a.status || "Applied",
      priority: a.priority ?? 0,
      deadline: a.deadline ? String(a.deadline).slice(0, 10) : "",
      categoryID: a.categoryID ?? null,
      notes: a.notes ?? "",
    });
  }

  clear() {
    this.selected.set(null);
  }

  async save() {
    const s = this.selected();
    if (!s) return;
    this.error.set(null);
    try {
      const v = this.editForm.getRawValue();
      await this.api.updateApplication(s.appID, {
        status: v.status,
        priority: v.priority ?? 0,
        deadline: v.deadline || null,
        categoryID: v.categoryID ?? null,
        notes: v.notes || null,
      });
      this.message.set("Saved.");
      this.selected.set(null);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to save.");
    }
  }

  async remove(a: ApplicationItem) {
    if (!confirm(`Delete application #${a.appID}?`)) return;
    this.error.set(null);
    try {
      await this.api.deleteApplication(a.appID);
      this.message.set("Deleted.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to delete.");
    }
  }

  async exportCsv() {
    this.error.set(null);
    if (!this.auth.isSignedIn()) {
      this.error.set("Please sign in to export.");
      return;
    }
    try {
      const blob = await firstValueFrom(this.http.get("/api/v1/applications/export.csv", { responseType: "blob" }));
      if (!blob) throw new Error("Export failed.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "applications.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.message.set("CSV exported.");
    } catch (e: any) {
      this.error.set(e?.message || "Export failed.");
    }
  }
}

