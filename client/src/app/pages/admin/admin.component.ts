import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { UserSummary } from "../../core/models";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Admin</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>User Management</div>
        <div class="muted" style="font-size: 12px">Admin only</div>
      </div>

      <div class="table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>User Types</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users()">
              <td>{{ u.userID }}</td>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>
                <select [value]="u.role" (change)="setRole(u.userID, $any($event.target).value)">
                  <option>Admin</option>
                  <option>Management</option>
                  <option>Regular</option>
                  <option>Control</option>
                </select>
              </td>
              <td>
                <input
                  [value]="draftTypes()[u.userID] || (u.userTypes || '')"
                  (input)="setTypes(u.userID, $any($event.target).value)"
                  placeholder="JobSeeker,Analyst"
                />
              </td>
              <td>
                <button class="btn ghost" type="button" (click)="save(u)">Save</button>
              </td>
            </tr>
            <tr *ngIf="!users().length">
              <td colspan="6" class="muted">No data.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="msg()">{{ msg() }}</div>
      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class AdminComponent {
  private readonly api = inject(ApiService);
  readonly users = signal<UserSummary[]>([]);
  readonly error = signal<string | null>(null);
  readonly msg = signal<string | null>(null);

  readonly draftRoles = signal<Record<number, string>>({});
  readonly draftTypes = signal<Record<number, string>>({});

  constructor() {
    void this.load();
  }

  async load() {
    this.error.set(null);
    this.msg.set(null);
    try {
      const rows = await this.api.users();
      this.users.set(rows);
      this.draftRoles.set({});
      this.draftTypes.set({});
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load users.");
      this.users.set([]);
    }
  }

  setRole(userID: number, role: string) {
    this.draftRoles.set({ ...this.draftRoles(), [userID]: role });
  }

  setTypes(userID: number, types: string) {
    this.draftTypes.set({ ...this.draftTypes(), [userID]: types });
  }

  async save(u: UserSummary) {
    this.error.set(null);
    this.msg.set(null);
    try {
      const role = this.draftRoles()[u.userID] ?? u.role;
      const userTypes = this.draftTypes()[u.userID] ?? (u.userTypes || "");
      await this.api.updateUser(u.userID, { role, userTypes });
      this.msg.set("User updated.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to update user.");
    }
  }
}

