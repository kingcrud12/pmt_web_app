import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { ApiError, Project } from '../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Mes projets</h1>
        <p class="sub">Vous ne voyez que les projets dont vous êtes membre.</p>
      </div>
      <button type="button" (click)="showForm.set(!showForm())">
        {{ showForm() ? 'Annuler' : 'Nouveau projet' }}
      </button>
    </header>

    @if (showForm()) {
      <form class="panel" (ngSubmit)="create()" #f="ngForm">
        <h2>Créer un projet</h2>
        <label for="name">Nom</label>
        <input id="name" name="name" [(ngModel)]="name" required maxlength="250" />

        <label for="description">Description</label>
        <textarea id="description" name="description" [(ngModel)]="description" rows="3"></textarea>

        <label for="startDate">Date de début</label>
        <input id="startDate" name="startDate" type="date" [(ngModel)]="startDate" required />

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

        <button type="submit" [disabled]="f.invalid">Créer — j'en serai administrateur</button>
      </form>
    }

    @if (loading()) {
      <p class="muted">Chargement…</p>
    } @else if (projects().length === 0) {
      <div class="empty">
        <p>Aucun projet pour l'instant.</p>
        <p class="muted">Créez-en un, ou demandez à être invité sur un projet existant.</p>
      </div>
    } @else {
      <ul class="cards">
        @for (p of projects(); track p.id) {
          <li class="card">
            <a [routerLink]="['/projects', p.id]">
              <span class="badge" [class]="'role-' + p.myRole.toLowerCase()">{{ roleLabel(p.myRole) }}</span>
              <h3>{{ p.name }}</h3>
              <p class="desc">{{ p.description || 'Sans description' }}</p>
              <p class="meta">
                Début {{ p.startDate }} · {{ p.memberCount }} membre{{ p.memberCount > 1 ? 's' : '' }}
              </p>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly error = signal<string | null>(null);

  name = '';
  description = '';
  startDate = new Date().toISOString().substring(0, 10);

  constructor() {
    this.reload();
  }

  roleLabel(role: string): string {
    return { ADMIN: 'Administrateur', MEMBER: 'Membre', OBSERVER: 'Observateur' }[role] ?? role;
  }

  create(): void {
    this.error.set(null);
    this.projectService.create(this.name, this.description, this.startDate).subscribe({
      next: () => {
        this.name = '';
        this.description = '';
        this.showForm.set(false);
        this.reload();
      },
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Création impossible'),
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.projectService.list().subscribe({
      next: (list) => {
        this.projects.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
