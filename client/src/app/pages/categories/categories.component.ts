import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { Category } from "../../core/models";

@Component({
  selector: "app-categories",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Categories</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Create Category</div>
        <div class="muted" style="font-size: 12px">Admin/Management only</div>
      </div>
      <form class="form" [formGroup]="form" (ngSubmit)="create()">
        <div class="grid">
          <label class="field">
            <span>Name</span>
            <input formControlName="name" placeholder="Software" />
          </label>
          <label class="field">
            <span>Description</span>
            <input formControlName="description" placeholder="Software engineering roles" />
          </label>
          <label class="field">
            <span>Manager ID</span>
            <input type="number" formControlName="managerID" placeholder="1" />
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
        <div>All Categories</div>
      </div>
      <div class="table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Manager</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of categories()">
              <td>{{ c.categoryID }}</td>
              <td>{{ c.name }}</td>
              <td>{{ c.description }}</td>
              <td>{{ c.managerName }} ({{ c.managerID }})</td>
            </tr>
            <tr *ngIf="!categories().length">
              <td colspan="4" class="muted">No data.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class CategoriesComponent {
  private readonly api = inject(ApiService);
  readonly categories = signal<Category[]>([]);
  readonly error = signal<string | null>(null);
  readonly msg = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl("", { nonNullable: true }),
    managerID: new FormControl<number | null>(1, { validators: [Validators.required] }),
  });

  constructor() {
    void this.load();
  }

  async load() {
    this.error.set(null);
    try {
      this.categories.set(await this.api.categories());
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load categories.");
      this.categories.set([]);
    }
  }

  async create() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.msg.set(null);
    try {
      const v = this.form.getRawValue();
      await this.api.createCategory({
        name: v.name,
        description: v.description || undefined,
        managerID: Number(v.managerID),
      });
      this.msg.set("Category created.");
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to create category.");
    }
  }
}

