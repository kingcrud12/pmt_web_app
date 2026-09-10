import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, User } from './models';

const TOKEN_KEY = 'pmt.accessToken';
const USER_KEY = 'pmt.user';

/**
 * Le jeton est conservé en localStorage et envoyé dans l'en-tête
 * Authorization par l'intercepteur.
 *
 * Compromis assumé : un cookie HttpOnly protégerait mieux contre le vol par
 * XSS, mais réintroduirait le CSRF (le navigateur enverrait le cookie tout
 * seul). Avec l'en-tête, le CSRF est impossible par construction ; la parade
 * au XSS est de ne jamais injecter de HTML non échappé — ce que fait Angular
 * par défaut tant qu'on n'utilise pas [innerHTML].
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<User | null>(this.readStoredUser());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.store(res)));
  }

  register(firstName: string, lastName: string, email: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/register', { firstName, lastName, email, password });
  }

  /**
   * Recharge le profil depuis le serveur.
   *
   * Le localStorage n'est qu'un cache : il garde la copie prise au moment de
   * la connexion, qui peut avoir vieilli. /api/auth/me fait foi — et vérifie
   * au passage que le jeton est encore valide.
   */
  me(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(tap((user) => this.storeUser(user)));
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

  private storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
