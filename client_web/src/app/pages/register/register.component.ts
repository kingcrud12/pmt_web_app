import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiError } from '../../core/models';
import { LogoComponent } from '../../core/ui/logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  styleUrl: '../auth.css',
  template: `
    <div class="auth">
      <aside class="pitch">
        <div class="brand"><app-logo [size]="34" /><span>PMT</span></div>

        <div class="argument">
          <h2>Trois rôles, et chacun sait ce qu'il peut faire.</h2>
          <p>Administrateur, membre, observateur. Les permissions sont vérifiées à chaque
             requête côté serveur — pas seulement dans l'interface.</p>
          <div class="figures">
            <div><span class="figure">60</span><span class="figure-label">Caractères de hachage</span></div>
            <div class="rule"></div>
            <div><span class="figure">0</span><span class="figure-label">Mot de passe en clair</span></div>
          </div>
        </div>

        <span class="footnote">Tech-Crud · 2026</span>
      </aside>

      <main class="form-side">
        <form class="form" (ngSubmit)="submit()" #f="ngForm">
          <header>
            <h1>Créer un compte</h1>
            <p class="sub">Quelques secondes suffisent.</p>
          </header>

          <div class="row">
            <div class="field">
              <label for="firstName">Prénom</label>
              <input id="firstName" name="firstName" [(ngModel)]="firstName" required maxlength="250" />
            </div>
            <div class="field">
              <label for="lastName">Nom</label>
              <input id="lastName" name="lastName" [(ngModel)]="lastName" required maxlength="250" />
            </div>
          </div>

          <div class="field">
            <label for="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" required
                   autocomplete="email" placeholder="vous@exemple.fr" />
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required
                   minlength="8" autocomplete="new-password" placeholder="8 caractères minimum" />
          </div>

          @if (error()) {
            <div class="error" role="alert">
              {{ error() }}
              @if (fieldErrors(); as fields) {
                <ul class="error-list">
                  @for (entry of fields | keyvalue; track entry.key) { <li>{{ entry.value }}</li> }
                </ul>
              }
            </div>
          }

          <button type="submit" class="block" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Création…' : 'Créer mon compte' }}
          </button>

          <div class="or"><span class="line"></span><span class="label">ou</span><span class="line"></span></div>

          <a routerLink="/login" class="alt">J'ai déjà un compte</a>
        </form>
      </main>
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
