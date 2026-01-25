import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { Company } from "../../core/models";

@Component({
  selector: "app-companies",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Companies</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Create Company</div>
        <div class="muted" style="font-size: 12px">Admin/Management only</div>
      </div>
      <form class="form" [formGroup]="form" (ngSubmit)="create()">
        <div class="grid">
          <label class="field">
            <span>Name</span>
            <input formControlName="name" placeholder="OpenAI" />
          </label>
          <label class="field">
            <span>Industry</span>
            <input formControlName="industry" placeholder="AI" />
          </label>
          <label class="field">
            <span>Location</span>
            <input formControlName="location" placeholder="San Francisco" />
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
        <div>All Companies</div>
      </div>
      <div class="table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Industry</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of companies()">
              <td>{{ c.companyID }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.industry }}</td>
              <td>{{ c.location }}</td>
            </tr>
            <tr *ngIf="!companies().length">
              <td colspan="4" class="muted">No data.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class CompaniesComponent {
  private readonly api = inject(ApiService);
  readonly companies = signal<Company[]>([]);
  readonly error = signal<string | null>(null);
  readonly msg = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    industry: new FormControl("", { nonNullable: true }),
    location: new FormControl("", { nonNullable: true }),
  });

  constructor() {
    void this.load();
  }

  async load() {
    this.error.set(null);
    try {
      this.companies.set(await this.api.companies());
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load companies.");
      this.companies.set([]);
    }
  }

  async create() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.msg.set(null);
    try {
      const v = this.form.getRawValue();
      await this.api.createCompany({ name: v.name, industry: v.industry || undefined, location: v.location || undefined });
      this.msg.set("Company created.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to create company.");
    }
  }
}

