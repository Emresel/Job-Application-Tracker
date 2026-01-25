import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ApiService } from "../../core/api.service";
import { StatusBreakdownItem } from "../../core/models";

@Component({
  selector: "app-statistics",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row">
      <h2>Statistics</h2>
      <div class="row-actions">
        <button class="btn" type="button" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <div>Status Breakdown</div>
        <div class="muted" style="font-size: 12px">Guest: sample data • Signed in: scoped data</div>
      </div>

      <div class="timeseries" *ngIf="rows().length; else empty">
        <ng-container *ngFor="let r of sorted()">
          <div class="barrow">
            <div class="muted" style="font-size: 12px">{{ r.status }}</div>
            <div class="bar"><div [style.width.%]="pct(r)"></div></div>
            <div style="font-size: 12px">{{ r.count }}</div>
          </div>
        </ng-container>
      </div>
      <ng-template #empty>
        <div class="muted" style="font-size: 12px">No data.</div>
      </ng-template>

      <div class="muted" style="font-size: 12px; margin-top: 10px" *ngIf="error()">{{ error() }}</div>
    </div>
  `,
})
export class StatisticsComponent {
  private readonly api = inject(ApiService);
  readonly rows = signal<StatusBreakdownItem[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  sorted() {
    return [...this.rows()].sort((a, b) => (b.count || 0) - (a.count || 0));
  }

  pct(r: StatusBreakdownItem) {
    const max = Math.max(...this.rows().map((x) => x.count), 1);
    return Math.round((r.count / max) * 100);
  }

  async load() {
    this.error.set(null);
    try {
      this.rows.set(await this.api.statusBreakdown());
    } catch (e: any) {
      this.error.set(e?.message || "Failed to load statistics.");
      this.rows.set([]);
    }
  }
}

