import { Injectable, computed, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Me } from "./models";

const TOKEN_KEY = "jat_token";
const API = "/api/v1";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http: HttpClient;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly me = signal<Me | null>(null);
  readonly isSignedIn = computed(() => Boolean(this.token()));
  readonly isAdmin = computed(() => this.me()?.role === "Admin");

  constructor(http: HttpClient) {
    this.http = http;
  }

  setToken(token: string | null) {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  async refreshMe(): Promise<Me | null> {
    if (!this.token()) {
      this.me.set(null);
      return null;
    }
    try {
      const me = await firstValueFrom(this.http.get<Me>(`${API}/users/me`));
      this.me.set(me);
      return me;
    } catch {
      // Token invalid/expired, clear it for a clean UX.
      this.setToken(null);
      this.me.set(null);
      return null;
    }
  }

  async login(email: string, password: string) {
    const out = await firstValueFrom(
      this.http.post<{ token: string }>(`${API}/auth/login`, { email, password }),
    );
    this.setToken(out.token);
    await this.refreshMe();
  }

  async register(name: string, email: string, password: string) {
    await firstValueFrom(this.http.post(`${API}/auth/register`, { name, email, password }));
    // Convenience: log in immediately after register
    await this.login(email, password);
  }

  logout() {
    this.setToken(null);
    this.me.set(null);
  }
}

