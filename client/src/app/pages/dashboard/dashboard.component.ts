import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { TimeseriesPoint } from "../../core/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Dashboard</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="refresh()">Refresh</button>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <div class="card-label">Total Applications</div>
        <div class="card-value">{{ summary()?.totalApplications ?? "-" }}</div>
      </div>
      <div class="card">
        <div class="card-label">Interviews</div>
        <div class="card-value">{{ summary()?.interviewsScheduled ?? "-" }}</div>
      </div>
      <div class="card">
        <div class="card-label">Offers</div>
        <div class="card-value">{{ summary()?.offersReceived ?? "-" }}</div>
      </div>
      <div class="card">
        <div class="card-label">Rejections</div>
        <div class="card-value">{{ summary()?.rejections ?? "-" }}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Daily Applications (Timeseries)</div>
        <div class="muted" style="font-size: 12px">Guest: sample data • Signed in: scoped data</div>
      </div>

      <form class="timeseries-form" [formGroup]="range" (ngSubmit)="loadSeries()">
        <div class="timeseries-controls">
          <label class="field">
            <span>From</span>
            <input type="date" formControlName="from" />
          </label>
          <label class="field">
            <span>To</span>
            <input type="date" formControlName="to" />
          </label>
          <button class="btn" type="submit">Load</button>
        </div>
        <div class="muted" style="font-size: 12px" *ngIf="error()">{{ error() }}</div>
      </form>

      <div class="timeseries" *ngIf="series().length; else empty">
        <ng-container *ngFor="let p of series()">
          <div class="barrow">
            <div class="muted" style="font-size: 12px">{{ p.date }}</div>
            <div class="bar"><div [style.width.%]="pct(p)"></div></div>
            <div style="font-size: 12px">{{ p.count }}</div>
          </div>
        </ng-container>
      </div>
      <ng-template #empty>
        <div class="muted" style="font-size: 12px">No data.</div>
      </ng-template>
    </div>
  `,
})
export class DashboardComponent {
  private readonly api = inject(ApiService);

  readonly summary = signal<any | null>(null);
  readonly series = signal<TimeseriesPoint[]>([]);
  readonly error = signal<string | null>(null);

  readonly range = new FormGroup({
    from: new FormControl("2025-01-01", { nonNullable: true }),
    to: new FormControl("2025-01-31", { nonNullable: true }),
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    this.error.set(null);
    try {
      this.summary.set(await this.api.dashboard());
      await this.loadSeries();
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load dashboard.");
    }
  }

  async loadSeries() {
    this.error.set(null);
    try {
      const { from, to } = this.range.getRawValue();
      this.series.set(await this.api.timeseries(from, to));
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load timeseries.");
      this.series.set([]);
    }
  }

  pct(p: TimeseriesPoint) {
    const rows = this.series();
    const max = Math.max(...rows.map((r) => r.count), 1);
    return Math.round((p.count / max) * 100);
  }
}

