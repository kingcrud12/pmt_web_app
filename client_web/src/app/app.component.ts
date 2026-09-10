import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <nav class="topbar">
      <a routerLink="/projects" class="brand">PMT</a>
      @if (auth.isLoggedIn()) {
        <div class="nav-right">
          <a routerLink="/profile" class="who">
            {{ auth.user()?.firstName }} {{ auth.user()?.lastName }}
          </a>
          <button type="button" class="ghost" (click)="auth.logout()">Se déconnecter</button>
        </div>
      }
    </nav>

    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
