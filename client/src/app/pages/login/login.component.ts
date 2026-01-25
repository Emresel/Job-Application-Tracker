import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Login</h2>
    </div>

    <div class="panel">
      <div class="muted" style="font-size: 12px">
        Seeded users:
        <code>admin@example.com / Admin123!</code>,
        <code>manager@example.com / Manager123!</code>,
        <code>user@example.com / User123!</code>
      </div>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="john@example.com" />
        </label>
        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" placeholder="••••••••" />
        </label>

        <div class="row-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || busy()">Sign in</button>
          <div class="muted" style="font-size: 12px" *ngIf="error()">{{ error() }}</div>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
  });

  async submit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      await this.router.navigateByUrl("/dashboard");
    } catch (e: any) {
      this.error.set(e?.message || "Sign-in failed.");
    } finally {
      this.busy.set(false);
    }
  }
}

