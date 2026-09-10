import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from './models';

const TOKEN_KEY = 'pmt.accessToken';
const USER_KEY = 'pmt.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<UserResponse | null>(this.readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password } satisfies LoginRequest)
      .pipe(tap((res) => this.store(res)));
  }

  register(firstName: string, lastName: string, email: string, password: string): Observable<UserResponse> {
    const body: RegisterRequest = { firstName, lastName, email, password };
    return this.http.post<UserResponse>('/api/auth/register', body);
  }

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/auth/me').pipe(tap((user) => this.storeUser(user)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private store(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this.storeUser(res.user);
  }

  private storeUser(user: UserResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      return null;
    }
  }
}
