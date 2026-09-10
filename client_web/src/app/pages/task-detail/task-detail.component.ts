import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { TaskService } from '../../core/task.service';
import { ApiError, Member, Project, Task, TaskPriority, TaskStatus } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (task(); as t) {
      <header class="page-head">
        <div>
          <a [routerLink]="['/projects', t.projectId]" class="back">← Retour au projet</a>
          <h1>{{ t.name }}</h1>
          <p class="sub">
            Créée le {{ t.createdAt | date: 'dd/MM/yyyy à HH:mm' }}
            @if (t.updatedAt) { · modifiée le {{ t.updatedAt | date: 'dd/MM/yyyy à HH:mm' }} }
          </p>
        </div>
        <div class="chips">
          <span class="chip" [class]="'prio-' + t.priority.toLowerCase()">{{ priorityLabel(t.priority) }}</span>
          <span class="chip" [class]="'status-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span>
        </div>
      </header>

      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (saved()) { <p class="success" role="status">Modifications enregistrées.</p> }

      <div class="columns">
        <section>
          <h2>Détail</h2>
          <dl class="detail">
            <div><dt>Description</dt><dd>{{ t.description || '—' }}</dd></div>
            <div><dt>Échéance</dt><dd>{{ t.dueDate || '—' }}</dd></div>
            <div><dt>Date de fin</dt><dd>{{ t.endDate || '—' }}</dd></div>
            <div><dt>Priorité</dt><dd>{{ priorityLabel(t.priority) }}</dd></div>
            <div><dt>Statut</dt><dd>{{ statusLabel(t.status) }}</dd></div>
            <div><dt>Assignée à</dt><dd>{{ t.assigneeName || 'Personne' }}</dd></div>
          </dl>
        </section>

        @if (canWrite()) {
          <aside>
            <h2>Modifier</h2>
            <form class="panel" (ngSubmit)="save()" #f="ngForm">
              <label for="name">Nom</label>
              <input id="name" name="name" [(ngModel)]="form.name" required maxlength="250" />

              <label for="description">Description</label>
              <textarea id="description" name="description" [(ngModel)]="form.description" rows="3"></textarea>

              <div class="row">
                <div>
                  <label for="dueDate">Échéance</label>
                  <input id="dueDate" name="dueDate" type="date" [(ngModel)]="form.dueDate" />
                </div>
                <div>
                  <label for="endDate">Date de fin</label>
                  <input id="endDate" name="endDate" type="date" [(ngModel)]="form.endDate" />
                </div>
              </div>

              <div class="row">
                <div>
                  <label for="priority">Priorité</label>
                  <select id="priority" name="priority" [(ngModel)]="form.priority">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>
                <div>
                  <label for="status">Statut</label>
                  <select id="status" name="status" [(ngModel)]="form.status">
                    <option value="TODO">À faire</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="DONE">Terminée</option>
                  </select>
                </div>
              </div>

              <label for="assigneeId">Assignée à</label>
              <select id="assigneeId" name="assigneeId" [(ngModel)]="form.assigneeId">
                <option value="">Personne</option>
                @for (m of members(); track m.userId) {
                  <option [value]="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
                }
              </select>

              <button type="submit" [disabled]="f.invalid">Enregistrer</button>
            </form>
          </aside>
        } @else {
          <aside>
            <div class="panel muted">
              <p>Vous consultez ce projet en <strong>observateur</strong>.</p>
              <p>La lecture est complète, la modification réservée aux membres et administrateurs.</p>
            </div>
          </aside>
        }
      </div>
    } @else if (loadError()) {
      <div class="empty">
        <h1>Tâche introuvable</h1>
        <p class="muted">Elle n'existe pas, ou vous n'êtes pas membre de son projet.</p>
        <a routerLink="/projects">← Mes projets</a>
      </div>
    }
  `,
})
export class TaskDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);

  private readonly taskId = this.route.snapshot.paramMap.get('taskId')!;

  readonly task = signal<Task | null>(null);
  readonly project = signal<Project | null>(null);
  readonly members = signal<Member[]>([]);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);
  readonly loadError = signal(false);

  readonly canWrite = computed(() => {
    const role = this.project()?.myRole;
    return role === 'ADMIN' || role === 'MEMBER';
  });

  form = {
    name: '',
    description: '',
    dueDate: '',
    endDate: '',
    priority: 'MEDIUM' as TaskPriority,
    status: 'TODO' as TaskStatus,
    assigneeId: '',
  };

  constructor() {
    this.reload();
  }

  priorityLabel(p: string): string {
    return { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' }[p] ?? p;
  }
  statusLabel(s: string): string {
    return { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée' }[s] ?? s;
  }

  save(): void {
    this.error.set(null);
    this.saved.set(false);

    this.taskService
      .update(this.taskId, {
        name: this.form.name,
        description: this.form.description || null,
        dueDate: this.form.dueDate || null,
        endDate: this.form.endDate || null,
        priority: this.form.priority,
        status: this.form.status,
        assigneeId: this.form.assigneeId || null,
      })
      .subscribe({
        next: (t) => {
          this.task.set(t);
          this.saved.set(true);
        },
        error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Enregistrement impossible'),
      });
  }

  private reload(): void {
    this.taskService.getOne(this.taskId).subscribe({
      next: (t) => {
        this.task.set(t);
        this.form = {
          name: t.name,
          description: t.description ?? '',
          dueDate: t.dueDate ?? '',
          endDate: t.endDate ?? '',
          priority: t.priority,
          status: t.status,
          assigneeId: t.assigneeId ?? '',
        };
        this.projectService.getOne(t.projectId).subscribe({ next: (p) => this.project.set(p) });
        this.projectService.members(t.projectId).subscribe({ next: (m) => this.members.set(m) });
      },
      error: () => this.loadError.set(true),
    });
  }
}
