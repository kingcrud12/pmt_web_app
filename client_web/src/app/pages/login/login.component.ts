import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiError } from '../../core/models';
import { LogoComponent } from '../../core/ui/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  styleUrl: '../auth.css',
  template: `
    <div class="auth">
      <aside class="pitch">
        <div class="brand"><app-logo [size]="34" /><span>PMT</span></div>

        <div class="argument">
          <h2>Vos projets, vos tâches, un seul endroit.</h2>
          <p>Créez un projet, invitez votre équipe, distribuez les rôles.
             Chacun voit exactement ce qui le concerne — ni plus, ni moins.</p>
          <div class="figures">
            <div><span class="figure">3</span><span class="figure-label">Rôles par projet</span></div>
            <div class="rule"></div>
            <div><span class="figure">0</span><span class="figure-label">Donnée partagée par erreur</span></div>
          </div>
        </div>

        <span class="footnote">Tech-Crud · 2026</span>
      </aside>

      <main class="form-side">
        <form class="form" (ngSubmit)="submit()" #f="ngForm">
          <header>
            <h1>Connexion</h1>
            <p class="sub">Accédez à votre espace de projets.</p>
          </header>

          <div class="field">
            <label for="email">Adresse e-mail</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" required
                   autocomplete="email" placeholder="vous@exemple.fr" />
          </div>

          <div class="field">
            <label for="password">Mot de passe</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required
                   autocomplete="current-password" placeholder="••••••••" />
          </div>

          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

          <button type="submit" class="block" [disabled]="loading() || f.invalid">
            {{ loading() ? 'Connexion…' : 'Se connecter' }}
          </button>

          <div class="or"><span class="line"></span><span class="label">ou</span><span class="line"></span></div>

          <a routerLink="/register" class="alt">Créer un compte</a>

          <p class="note">Un e-mail inconnu et un mot de passe faux donnent la même réponse :
             impossible de deviner quels comptes existent.</p>
        </form>
      </main>
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
        this.error.set((e.error as ApiError)?.message ?? 'Connexion impossible');
        this.loading.set(false);
      },
    });
  }
}
