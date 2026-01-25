import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { TimeseriesPoint } from "../../core/models";

type ChartMode = "bars" | "heatmap";
const DASHBOARD_CHARTMODE_KEY = "jat_chartMode_dashboard_timeseries_v2";

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
          <label class="field">
            <span>View</span>
            <select [value]="chartMode()" (change)="setChartMode($any($event.target).value)">
              <option value="heatmap">Activity heatmap</option>
              <option value="bars">Bars</option>
            </select>
          </label>
          <button class="btn" type="submit">Load</button>
        </div>
        <div class="muted" style="font-size: 12px" *ngIf="error()">{{ error() }}</div>
      </form>

      <div [ngSwitch]="chartMode()" *ngIf="sortedSeries().length; else empty">
        <div *ngSwitchCase="'bars'" class="timeseries">
          <ng-container *ngFor="let p of sortedSeries()">
            <div class="barrow">
              <div class="muted" style="font-size: 12px">{{ p.date }}</div>
              <div class="bar"><div [style.width.%]="pct(p)"></div></div>
              <div style="font-size: 12px">{{ p.count }}</div>
            </div>
          </ng-container>
        </div>

        <div *ngSwitchCase="'heatmap'" class="heatmap-wrap">
          <div class="heatmap">
            <div class="heatmap-week" *ngFor="let week of heatmapWeeks()">
              <div
                class="heatmap-day"
                *ngFor="let d of week"
                [class.off]="!d.inRange"
                [class.l1]="d.level === 1"
                [class.l2]="d.level === 2"
                [class.l3]="d.level === 3"
                [class.l4]="d.level === 4"
                [attr.title]="d.title"
              ></div>
            </div>
          </div>
          <div class="muted" style="font-size: 12px; margin-top: 8px">
            Tip: hover a day to see the exact count.
          </div>
        </div>
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
  readonly chartMode = signal<ChartMode>(this.loadChartMode());

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

  sortedSeries() {
    return [...this.series()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  pct(p: TimeseriesPoint) {
    const rows = this.sortedSeries();
    const max = Math.max(...rows.map((r) => r.count), 1);
    return Math.round((p.count / max) * 100);
  }

  setChartMode(mode: ChartMode) {
    this.chartMode.set(mode);
    try {
      localStorage.setItem(DASHBOARD_CHARTMODE_KEY, mode);
    } catch {
      // ignore storage errors
    }
  }

  private loadChartMode(): ChartMode {
    try {
      const v = localStorage.getItem(DASHBOARD_CHARTMODE_KEY);
      if (v === "bars" || v === "heatmap") return v;
    } catch {
      // ignore
    }
    return "heatmap";
  }

  heatmapWeeks(): Array<
    Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4; inRange: boolean; title: string }>
  > {
    const { from, to } = this.range.getRawValue();
    const fromDate = this.parseIsoDate(from);
    const toDate = this.parseIsoDate(to);
    if (!fromDate || !toDate || fromDate > toDate) return [];

    const counts = new Map(this.sortedSeries().map((p) => [p.date, p.count]));
    const max = Math.max(...Array.from(counts.values()), 1);

    const start = this.startOfWeek(fromDate); // Sunday
    const end = this.endOfWeek(toDate); // Saturday

    const weeks: Array<
      Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4; inRange: boolean; title: string }>
    > = [];

    let cur = new Date(start.getTime());
    while (cur <= end) {
      const week: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4; inRange: boolean; title: string }> =
        [];
      for (let i = 0; i < 7; i++) {
        const iso = this.formatIsoDate(cur);
        const inRange = cur >= fromDate && cur <= toDate;
        const count = inRange ? counts.get(iso) ?? 0 : 0;
        const level = this.levelFor(count, max);
        week.push({
          date: iso,
          count,
          level,
          inRange,
          title: `${iso}: ${count} application${count === 1 ? "" : "s"}`,
        });
        cur = this.addDays(cur, 1);
      }
      weeks.push(week);
    }

    return weeks;
  }

  private levelFor(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (count <= 0) return 0;
    const r = count / max;
    if (r <= 0.25) return 1;
    if (r <= 0.5) return 2;
    if (r <= 0.75) return 3;
    return 4;
  }

  private parseIsoDate(s: string): Date | null {
    if (!s) return null;
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private formatIsoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  private startOfWeek(d: Date): Date {
    const out = new Date(d.getTime());
    out.setHours(0, 0, 0, 0);
    out.setDate(out.getDate() - out.getDay()); // Sunday=0
    return out;
  }

  private endOfWeek(d: Date): Date {
    const out = this.startOfWeek(d);
    out.setDate(out.getDate() + 6);
    return out;
  }

  private addDays(d: Date, days: number): Date {
    const out = new Date(d.getTime());
    out.setDate(out.getDate() + days);
    return out;
  }
}

