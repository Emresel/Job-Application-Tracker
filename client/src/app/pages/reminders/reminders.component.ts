import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { AuthService } from "../../core/auth.service";
import { Reminder } from "../../core/models";

@Component({
  selector: "app-reminders",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Reminders</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Create Reminder</div>
        <div class="muted" style="font-size: 12px">Requires sign-in</div>
      </div>
      <form class="form" [formGroup]="form" (ngSubmit)="create()">
        <div class="grid">
          <label class="field">
            <span>Application ID (optional)</span>
            <input type="number" formControlName="appID" placeholder="7" />
          </label>
          <label class="field">
            <span>Date</span>
            <input type="date" formControlName="reminderDate" />
          </label>
          <label class="field" style="grid-column: span 2">
            <span>Message</span>
            <input type="text" formControlName="message" placeholder="Prepare for interview" />
          </label>
        </div>
        <div class="row-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid">Create</button>
          <div class="muted" style="font-size: 12px" *ngIf="msg()">{{ msg() }}</div>
        </div>
      </form>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Your Reminders</div>
      </div>
      <div class="table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>App ID</th>
              <th>Date</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reminders()">
              <td>{{ r.reminderID }}</td>
              <td>{{ r.appID }}</td>
              <td>{{ r.reminderDate }}</td>
              <td>{{ r.message }}</td>
              <td>
                <button class="btn ghost" type="button" (click)="remove(r)" [disabled]="!auth.isSignedIn()">
                  Delete
                </button>
              </td>
            </tr>
            <tr *ngIf="!reminders().length">
              <td colspan="5" class="muted">No data.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class RemindersComponent {
  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly reminders = signal<Reminder[]>([]);
  readonly error = signal<string | null>(null);
  readonly msg = signal<string | null>(null);

  readonly form = new FormGroup({
    appID: new FormControl<number | null>(null),
    reminderDate: new FormControl("2025-01-25", { nonNullable: true, validators: [Validators.required] }),
    message: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    void this.load();
  }

  async load() {
    this.error.set(null);
    this.msg.set(null);
    try {
      this.reminders.set(await this.api.reminders());
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load reminders (sign-in required).");
      this.reminders.set([]);
    }
  }

  async create() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.msg.set(null);
    try {
      const v = this.form.getRawValue();
      await this.api.createReminder({
        appID: v.appID ?? undefined,
        reminderDate: v.reminderDate,
        message: v.message,
      });
      this.msg.set("Reminder created.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to create reminder.");
    }
  }

  async remove(r: Reminder) {
    if (!confirm(`Delete reminder #${r.reminderID}?`)) return;
    this.error.set(null);
    this.msg.set(null);
    try {
      await this.api.deleteReminder(r.reminderID);
      this.msg.set("Deleted.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to delete.");
    }
  }
}

