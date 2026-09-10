import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { TaskService } from '../../core/task.service';
import { ApiError, Member, Project, Task, TaskPriority, TaskStatus } from '../../core/models';
import { PRIORITY_LABEL, STATUS_LABEL, frDate, isOverdue } from '../../core/ui/labels';
import { avatarColor, initials } from '../../core/ui/initials';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: '../page.css',
  template: `
    @if (task(); as t) {
      <header class="page-head">
        <div class="head-text">
          <nav class="crumbs">
            <a routerLink="/projects">Projets</a><span>/</span>
            <a [routerLink]="['/projects', t.projectId]">{{ project()?.name ?? 'Projet' }}</a>
            <span>/</span><span class="here">Tâche</span>
          </nav>
          <div class="head-title">
            <h1>{{ t.name }}</h1>
            <span class="chip" [class]="'prio-' + t.priority.toLowerCase()">{{ priorityLabel(t.priority) }}</span>
            <span class="chip" [class]="'status-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span>
          </div>
          <p class="mono muted" style="font-size:12px">
            Créée le {{ t.createdAt | date: 'dd/MM/yyyy à HH:mm' }}
            @if (t.updatedAt) { · modifiée le {{ t.updatedAt | date: 'dd/MM/yyyy à HH:mm' }} }
          </p>
        </div>
        @if (canWrite() && t.status !== 'DONE') {
          <div class="actions">
            <button type="button" class="secondary" (click)="markDone()">Marquer terminée</button>
          </div>
        }
      </header>

      <div class="body">
        @if (error()) { <p class="error" role="alert" style="margin-bottom:18px">{{ error() }}</p> }
        @if (saved()) { <p class="success" role="status" style="margin-bottom:18px">Modifications enregistrées.</p> }

        <div class="columns">
          <section>
            <div class="section-head"><h2>Détail</h2></div>
            <dl class="detail">
              <div><dt class="label">Description</dt><dd>{{ t.description || '—' }}</dd></div>
              <div><dt class="label">Échéance</dt>
                <dd class="mono" [style.color]="late(t) ? 'var(--signal)' : null">{{ frDate(t.dueDate) }}</dd></div>
              <div><dt class="label">Date de fin</dt><dd class="mono">{{ frDate(t.endDate) }}</dd></div>
              <div><dt class="label">Priorité</dt><dd>{{ priorityLabel(t.priority) }}</dd></div>
              <div><dt class="label">Statut</dt><dd>{{ statusLabel(t.status) }}</dd></div>
              <div><dt class="label">Assignée à</dt>
                <dd>
                  @if (t.assigneeId) {
                    <span style="display:flex; align-items:center; gap:9px">
                      <span class="avatar sm" [style.background]="avatarColor(t.assigneeId)">{{ initialsOf(t.assigneeName) }}</span>
                      {{ t.assigneeName }}
                    </span>
                  } @else { Personne }
                </dd>
              </div>
            </dl>
          </section>

          <aside>
            @if (canWrite()) {
              <div class="section-head"><h2>Modifier</h2></div>
              <form class="panel" (ngSubmit)="save()" #f="ngForm">
                <div class="field">
                  <label for="name">Nom</label>
                  <input id="name" name="name" [(ngModel)]="form.name" required maxlength="250" />
                </div>
                <div class="field">
                  <label for="description">Description</label>
                  <textarea id="description" name="description" [(ngModel)]="form.description" rows="3"></textarea>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="priority">Priorité</label>
                    <select id="priority" name="priority" [(ngModel)]="form.priority">
                      <option value="LOW">Basse</option><option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="status">Statut</label>
                    <select id="status" name="status" [(ngModel)]="form.status">
                      <option value="TODO">À faire</option><option value="IN_PROGRESS">En cours</option>
                      <option value="DONE">Terminée</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="dueDate">Échéance</label>
                    <input id="dueDate" name="dueDate" type="date" [(ngModel)]="form.dueDate" />
                  </div>
                  <div class="field">
                    <label for="endDate">Date de fin</label>
                    <input id="endDate" name="endDate" type="date" [(ngModel)]="form.endDate" />
                  </div>
                </div>
                <div class="field">
                  <label for="assigneeId">Assignée à</label>
                  <select id="assigneeId" name="assigneeId" [(ngModel)]="form.assigneeId">
                    <option value="">Personne</option>
                    @for (m of members(); track m.userId) {
                      <option [value]="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
                    }
                  </select>
                  <small>Seuls les membres du projet apparaissent ici.</small>
                </div>
                <div><button type="submit" [disabled]="f.invalid">Enregistrer</button></div>
              </form>
            } @else {
              <div class="section-head"><h2>Lecture seule</h2></div>
              <div class="panel">
                <p class="sub">Vous consultez ce projet en <strong>observateur</strong>.</p>
                <p class="sub">La lecture est complète ; la modification est réservée aux membres
                   et aux administrateurs.</p>
              </div>
            }
          </aside>
        </div>
      </div>
    } @else if (loadError()) {
      <div class="empty" style="padding-top:6rem">
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
    const r = this.project()?.myRole;
    return r === 'ADMIN' || r === 'MEMBER';
  });

  readonly frDate = frDate;
  readonly avatarColor = avatarColor;

  form = {
    name: '', description: '', dueDate: '', endDate: '',
    priority: 'MEDIUM' as TaskPriority, status: 'TODO' as TaskStatus, assigneeId: '',
  };

  constructor() {
    this.reload();
  }

  priorityLabel(p: TaskPriority) { return PRIORITY_LABEL[p]; }
  statusLabel(s: TaskStatus) { return STATUS_LABEL[s]; }
  late(t: Task) { return isOverdue(t.dueDate, t.status); }
  initialsOf(name: string | null): string {
    const [a, b] = (name ?? '').split(' ');
    return initials(a ?? '', b ?? '');
  }

  markDone(): void {
    this.form.status = 'DONE';
    if (!this.form.endDate) this.form.endDate = new Date().toISOString().substring(0, 10);
    this.save();
  }

  save(): void {
    this.error.set(null);
    this.saved.set(false);
    this.taskService.update(this.taskId, {
      name: this.form.name,
      description: this.form.description || null,
      dueDate: this.form.dueDate || null,
      endDate: this.form.endDate || null,
      priority: this.form.priority,
      status: this.form.status,
      assigneeId: this.form.assigneeId || null,
    }).subscribe({
      next: (t) => { this.task.set(t); this.saved.set(true); },
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Enregistrement impossible'),
    });
  }

  private reload(): void {
    this.taskService.getOne(this.taskId).subscribe({
      next: (t) => {
        this.task.set(t);
        this.form = {
          name: t.name, description: t.description ?? '', dueDate: t.dueDate ?? '',
          endDate: t.endDate ?? '', priority: t.priority, status: t.status,
          assigneeId: t.assigneeId ?? '',
        };
        this.projectService.getOne(t.projectId).subscribe({ next: (p) => this.project.set(p) });
        this.projectService.members(t.projectId).subscribe({ next: (m) => this.members.set(m) });
      },
      error: () => this.loadError.set(true),
    });
  }
}
