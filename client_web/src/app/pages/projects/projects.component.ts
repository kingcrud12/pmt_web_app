import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { ApiError, Project, ProjectRole } from '../../core/models';
import { ROLE_LABEL, frDate } from '../../core/ui/labels';

type Filter = 'all' | 'admin';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: '../page.css',
  template: `
    <header class="page-head">
      <div class="head-text">
        <h1>Projets</h1>
        <p class="sub">Vous ne voyez que les projets dont vous êtes membre.</p>
      </div>
      <div class="actions">
        <button type="button" [class.secondary]="showForm()" (click)="showForm.set(!showForm())">
          @if (!showForm()) {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nouveau projet
          } @else { Annuler }
        </button>
      </div>
    </header>

    <div class="toolbar">
      <button type="button" class="filter" [class.on]="filter() === 'all'" (click)="filter.set('all')">
        Tous · {{ projects().length }}
      </button>
      <button type="button" class="filter" [class.on]="filter() === 'admin'" (click)="filter.set('admin')">
        Où je suis admin · {{ adminCount() }}
      </button>
      <span class="grow"></span>
      <span class="label">Trier par · récents</span>
    </div>

    <div class="body">
      @if (showForm()) {
        <form class="panel" style="margin-bottom:22px; max-width:640px" (ngSubmit)="create()" #f="ngForm">
          <h2>Créer un projet</h2>
          <div class="field">
            <label for="name">Nom</label>
            <input id="name" name="name" [(ngModel)]="name" required maxlength="250"
                   placeholder="Refonte du site" />
          </div>
          <div class="field">
            <label for="description">Description</label>
            <textarea id="description" name="description" [(ngModel)]="description" rows="3"
                      placeholder="En une ou deux phrases, ce que le projet doit produire."></textarea>
          </div>
          <div class="field" style="max-width:200px">
            <label for="startDate">Date de début</label>
            <input id="startDate" name="startDate" type="date" [(ngModel)]="startDate" required />
          </div>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <div>
            <button type="submit" [disabled]="f.invalid">Créer — j'en serai administrateur</button>
          </div>
        </form>
      }

      @if (loading()) {
        <p class="muted">Chargement…</p>
      } @else if (visible().length === 0) {
        <div class="empty">
          <h2>{{ filter() === 'admin' ? 'Aucun projet dont vous êtes administrateur' : 'Aucun projet pour l’instant' }}</h2>
          <p class="muted">Créez-en un, ou demandez à être invité sur un projet existant.</p>
        </div>
      } @else {
        <div class="cards">
          @for (p of visible(); track p.id) {
            <a class="card" [routerLink]="['/projects', p.id]">
              <div class="card-top">
                <span class="card-name">
                  <span class="dot" [style.background]="dotColor(p.myRole)"></span>
                  <strong class="truncate">{{ p.name }}</strong>
                </span>
                <span class="chip" [class]="'role-' + p.myRole.toLowerCase()">{{ roleLabel(p.myRole) }}</span>
              </div>

              <p class="desc">{{ p.description || 'Sans description' }}</p>

              <div style="display:flex; flex-direction:column; gap:7px">
                <div style="display:flex; justify-content:space-between; align-items:baseline">
                  <span class="label">Avancement</span>
                  <span class="mono" style="font-size:12px; font-weight:500">{{ p.doneTaskCount }}/{{ p.taskCount }}</span>
                </div>
                <div class="progress"><span [style.width.%]="percent(p)"></span></div>
              </div>

              <div class="divider"></div>

              <div class="card-foot">
                <span class="muted" style="font-size:12.5px">
                  {{ p.memberCount }} membre{{ p.memberCount > 1 ? 's' : '' }}
                </span>
                <span class="mono" style="font-size:11.5px; color:var(--ink-3)">Début {{ frDate(p.startDate) }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal<Filter>('all');

  readonly adminCount = computed(() => this.projects().filter((p) => p.myRole === 'ADMIN').length);
  readonly visible = computed(() =>
    this.filter() === 'admin' ? this.projects().filter((p) => p.myRole === 'ADMIN') : this.projects()
  );

  readonly frDate = frDate;

  name = '';
  description = '';
  startDate = new Date().toISOString().substring(0, 10);

  constructor() {
    this.reload();
  }

  roleLabel(role: ProjectRole): string {
    return ROLE_LABEL[role];
  }

  dotColor(role: ProjectRole): string {
    return { ADMIN: '#4A3F7A', MEMBER: '#14555F', OBSERVER: '#8E9089' }[role];
  }

  percent(p: Project): number {
    return p.taskCount === 0 ? 0 : Math.round((p.doneTaskCount / p.taskCount) * 100);
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
