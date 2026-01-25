import { Component, OnInit, computed, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { NgIf } from "@angular/common";
import { AuthService } from "./core/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnInit {
  readonly auth = inject(AuthService);
  readonly meLabel = computed(() => {
    const me = this.auth.me();
    if (!me) return "Signed out (guest)";
    return `${me.name} • ${me.role}${me.userTypes ? ` • ${me.userTypes}` : ""}`;
  });

  async ngOnInit() {
    await this.auth.refreshMe();
  }

  signOut() {
    this.auth.logout();
  }
}
