import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth.service';
import { ProjectService } from '../project.service';
import { ProjectResponse, ProjectRole } from '../models';
import { LogoComponent } from './logo.component';
import { avatarColor, initials } from './initials';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoComponent],
  styleUrl: './sidebar.component.css',
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="brand">
        <a routerLink="/dashboard" aria-label="Accueil PMT"><app-logo [size]="30" /></a>
        @if (!collapsed()) { <span class="wordmark">PMT</span> }
        <button type="button" class="collapse" (click)="toggle()"
                [attr.aria-label]="collapsed() ? 'Déployer le menu' : 'Réduire le menu'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            @if (collapsed()) { <path d="M9 6l6 6-6 6" /> } @else { <path d="M15 6l-6 6 6 6" /> }
          </svg>
        </button>
      </div>

      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item"
           [attr.title]="collapsed() ? 'Tableau de bord' : null">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          @if (!collapsed()) { <span>Tableau de bord</span> }
        </a>

        <a routerLink="/projects" routerLinkActive="active" class="nav-item"
           [attr.title]="collapsed() ? 'Projets' : null">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          @if (!collapsed()) { <span>Projets</span> }
        </a>

        <a routerLink="/profile" routerLinkActive="active" class="nav-item"
           [attr.title]="collapsed() ? 'Mon profil' : null">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
          @if (!collapsed()) { <span>Mon profil</span> }
        </a>
      </nav>

      @if (!collapsed() && projects().length > 0) {
        <div class="section-label">Projets récents</div>
        <nav class="nav recents">
          @for (p of projects().slice(0, 5); track p.id) {
            <a [routerLink]="['/projects', p.id]" routerLinkActive="active" class="nav-item small">
              <span class="dot" [style.background]="dotColor(p.myRole)"></span>
              <span class="truncate">{{ p.name }}</span>
            </a>
          }
        </nav>
      }

      <div class="spacer"></div>

      <div class="foot">
        @if (auth.user(); as u) {
          <a routerLink="/profile" routerLinkActive="active" class="account"
             [attr.title]="collapsed() ? u.firstName + ' ' + u.lastName : 'Mon profil'">
            <span class="avatar" [style.background]="avatarColor(u.id)">{{ initials(u.firstName, u.lastName) }}</span>
            @if (!collapsed()) {
              <div class="who">
                <span class="name truncate">{{ u.firstName }} {{ u.lastName }}</span>
                <span class="mail truncate">{{ u.email }}</span>
              </div>
            }
          </a>
          @if (!collapsed()) {
            <button type="button" class="logout-row" (click)="auth.logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Se déconnecter</span>
            </button>
          }
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<ProjectResponse[]>([]);
  readonly collapsed = signal(localStorage.getItem('pmt.sidebarCollapsed') === '1');

  readonly initials = initials;
  readonly avatarColor = avatarColor;

  constructor() {
    this.projectService.list().subscribe({ next: (list) => this.projects.set(list) });
  }

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('pmt.sidebarCollapsed', next ? '1' : '0');
  }

  dotColor(role: ProjectRole): string {
    return { ADMIN: '#4A3F7A', MEMBER: '#14555F', OBSERVER: '#8E9089' }[role];
  }
}
