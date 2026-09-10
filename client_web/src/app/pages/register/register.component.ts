import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiError } from '../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <h1>Créer un compte</h1>
      <p class="sub">Quelques secondes suffisent.</p>

      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="row">
          <div>
            <label for="firstName">Prénom</label>
            <input id="firstName" name="firstName" [(ngModel)]="firstName" required />
          </div>
          <div>
            <label for="lastName">Nom</label>
            <input id="lastName" name="lastName" [(ngModel)]="lastName" required />
          </div>
        </div>

        <label for="email">Adresse e-mail</label>
        <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />

        <label for="password">Mot de passe</label>
        <input id="password" name="password" type="password" [(ngModel)]="password" required
               minlength="8" autocomplete="new-password" />
        <small>8 caractères minimum.</small>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
          @if (fieldErrors()) {
            <ul class="error-list">
              @for (entry of fieldErrors() | keyvalue; track entry.key) {
                <li>{{ entry.value }}</li>
              }
            </ul>
          }
        }

        <button type="submit" [disabled]="loading() || f.invalid">
          {{ loading() ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="switch">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string> | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fieldErrors.set(null);

    this.auth.register(this.firstName, this.lastName, this.email, this.password).subscribe({
      next: () => {
        // Inscription réussie : on enchaîne sur une vraie connexion pour
        // obtenir un jeton, plutôt que de faire confiance au client.
        this.auth.login(this.email, this.password).subscribe({
          next: () => this.router.navigate(['/projects']),
          error: () => this.router.navigate(['/login']),
        });
      },
      error: (e) => {
        const body = e.error as ApiError;
        this.error.set(body?.message ?? 'Inscription impossible');
        this.fieldErrors.set(body?.fields ?? null);
        this.loading.set(false);
      },
    });
  }
}
