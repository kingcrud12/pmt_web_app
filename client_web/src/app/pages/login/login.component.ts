import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiError } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h1>Connexion</h1>
      <p class="sub">Accédez à votre espace de projets.</p>

      <form (ngSubmit)="submit()" #f="ngForm">
        <label for="email">Adresse e-mail</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />

        <label for="password">Mot de passe</label>
        <input id="password" name="password" type="password" [(ngModel)]="password" required
               autocomplete="current-password" />

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading() || f.invalid">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="switch">Pas encore de compte ? <a routerLink="/register">Créer un compte</a></p>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: (e) => {
        // On affiche le message du serveur, volontairement identique pour un
        // email inconnu et un mot de passe faux.
        this.error.set((e.error as ApiError)?.message ?? 'Connexion impossible');
        this.loading.set(false);
      },
    });
  }
}
