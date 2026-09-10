import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { SidebarComponent } from './core/ui/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  styles: [`
    .shell { display: flex; min-height: 100vh; }
    .content { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; }
    @media (max-width: 720px) { .shell { flex-direction: column; } }
  `],
  template: `
    @if (auth.isLoggedIn()) {
      <div class="shell">
        <app-sidebar />
        <div class="content"><router-outlet /></div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
