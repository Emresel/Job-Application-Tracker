import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row">
      <h2>Register</h2>
    </div>

    <div class="panel">
      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field">
          <span>Name</span>
          <input type="text" formControlName="name" placeholder="John Doe" />
        </label>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" placeholder="john@example.com" />
        </label>
        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" placeholder="Secret123!" />
        </label>

        <div class="row-actions">
          <button class="btn primary" type="submit" [disabled]="form.invalid || busy()">Create account</button>
          <div class="muted" style="font-size: 12px" *ngIf="error()">{{ error() }}</div>
        </div>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl("", { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  async submit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.auth.register(this.form.value.name!, this.form.value.email!, this.form.value.password!);
      await this.router.navigateByUrl("/dashboard");
    } catch (e: any) {
      this.error.set(e?.message || "Registration failed.");
    } finally {
      this.busy.set(false);
    }
  }
}

