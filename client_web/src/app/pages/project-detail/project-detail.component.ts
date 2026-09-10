import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { TaskService } from '../../core/task.service';
import { ApiError, Member, Project, ProjectRole, Task, TaskPriority } from '../../core/models';
import { PRIORITY_LABEL, ROLE_LABEL, STATUS_LABEL, frDate, isOverdue } from '../../core/ui/labels';
import { avatarColor, initials } from '../../core/ui/initials';

type TaskFilter = 'all' | 'mine' | 'late';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: '../page.css',
  template: `
    @if (project(); as p) {
      <header class="page-head">
        <div class="head-text">
          <nav class="crumbs">
            <a routerLink="/projects">Projets</a><span>/</span><span class="here">{{ p.name }}</span>
          </nav>
          <div class="head-title">
            <h1>{{ p.name }}</h1>
            <span class="chip" [class]="'role-' + p.myRole.toLowerCase()">{{ roleLabel(p.myRole) }}</span>
          </div>
          <p class="sub">{{ p.description || 'Sans description' }} · début {{ frDate(p.startDate) }}</p>
        </div>
        @if (canWrite()) {
          <div class="actions">
            <button type="button" [class.secondary]="showTaskForm()" (click)="showTaskForm.set(!showTaskForm())">
              @if (!showTaskForm()) {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Nouvelle tâche
              } @else { Annuler }
            </button>
          </div>
        }
      </header>

      <div class="body">
        @if (error()) { <p class="error" role="alert" style="margin-bottom:18px">{{ error() }}</p> }

        <div class="columns">
          <section>
            <div class="section-head">
              <h2>Tâches</h2>
              <span class="mono muted" style="font-size:12px">
                {{ doneCount() }} sur {{ tasks().length }} terminées
              </span>
              <span class="grow"></span>
              <div style="display:flex; gap:7px">
                <button type="button" class="filter" [class.on]="filter() === 'all'" (click)="filter.set('all')">Toutes</button>
                <button type="button" class="filter" [class.on]="filter() === 'mine'" (click)="filter.set('mine')">À moi</button>
                <button type="button" class="filter" [class.on]="filter() === 'late'" (click)="filter.set('late')">En retard</button>
              </div>
            </div>

            @if (showTaskForm()) {
              <form class="panel" style="margin-bottom:16px" (ngSubmit)="createTask()" #tf="ngForm">
                <div class="field">
                  <label for="tname">Nom de la tâche</label>
                  <input id="tname" name="tname" [(ngModel)]="taskName" required maxlength="250" />
                </div>
                <div class="field">
                  <label for="tdesc">Description</label>
                  <textarea id="tdesc" name="tdesc" [(ngModel)]="taskDescription" rows="2"></textarea>
                </div>
                <div class="row">
                  <div class="field">
                    <label for="tdue">Échéance</label>
                    <input id="tdue" name="tdue" type="date" [(ngModel)]="taskDueDate" />
                  </div>
                  <div class="field">
                    <label for="tprio">Priorité</label>
                    <select id="tprio" name="tprio" [(ngModel)]="taskPriority">
                      <option value="LOW">Basse</option><option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="tassignee">Assignée à</label>
                    <select id="tassignee" name="tassignee" [(ngModel)]="taskAssigneeId">
                      <option value="">Personne</option>
                      @for (m of members(); track m.userId) {
                        <option [value]="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div><button type="submit" [disabled]="tf.invalid">Créer la tâche</button></div>
              </form>
            }

            @if (visibleTasks().length === 0) {
              <div class="empty">
                <p class="muted">{{ tasks().length === 0 ? 'Aucune tâche pour l’instant.' : 'Aucune tâche ne correspond à ce filtre.' }}</p>
              </div>
            } @else {
              <div class="list">
                @for (t of visibleTasks(); track t.id) {
                  <a class="task" [routerLink]="['/tasks', t.id]">
                    <span class="chips">
                      <span class="chip" [class]="'prio-' + t.priority.toLowerCase()">{{ priorityLabel(t.priority) }}</span>
                      <span class="chip" [class]="'status-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span>
                    </span>
                    <span class="name truncate">{{ t.name }}</span>
                    <span class="due" [class.late]="late(t)">{{ frDate(t.dueDate) }}</span>
                    @if (t.assigneeId) {
                      <span class="avatar sm" [style.background]="avatarColor(t.assigneeId)"
                            [title]="t.assigneeName">{{ initialsOf(t.assigneeName) }}</span>
                    } @else {
                      <span class="avatar sm empty" title="Non assignée"></span>
                    }
                  </a>
                }
              </div>
            }
          </section>

          <aside>
            <div class="section-head">
              <h2>Membres</h2>
              <span class="grow"></span>
              <span class="mono muted" style="font-size:12px">{{ members().length }}</span>
            </div>

            <div class="members" style="margin-bottom:16px">
              @for (m of members(); track m.userId) {
                <div class="member">
                  <span class="avatar" [style.background]="avatarColor(m.userId)">{{ initials(m.firstName, m.lastName) }}</span>
                  <div class="who">
                    <span class="name truncate">{{ m.firstName }} {{ m.lastName }}</span>
                    <span class="mail truncate">{{ m.email }}</span>
                  </div>
                  @if (isAdmin()) {
                    <select [ngModel]="m.role" (ngModelChange)="changeRole(m, $event)" [name]="'role-' + m.userId"
                            [attr.aria-label]="'Rôle de ' + m.firstName">
                      <option value="ADMIN">Administrateur</option><option value="MEMBER">Membre</option>
                      <option value="OBSERVER">Observateur</option>
                    </select>
                  } @else {
                    <span class="chip" [class]="'role-' + m.role.toLowerCase()">{{ roleLabel(m.role) }}</span>
                  }
                </div>
              }
            </div>

            @if (isAdmin()) {
              <form class="panel" (ngSubmit)="invite()" #mf="ngForm">
                <span class="label">Inviter quelqu'un</span>
                <div class="field">
                  <input id="invEmail" name="invEmail" type="email" [(ngModel)]="inviteEmail" required
                         placeholder="adresse@exemple.fr" aria-label="Adresse e-mail à inviter" />
                </div>
                <div style="display:flex; gap:8px; align-items:flex-end">
                  <div class="field" style="flex-grow:1">
                    <select id="invRole" name="invRole" [(ngModel)]="inviteRole" aria-label="Rôle">
                      <option value="MEMBER">Membre</option><option value="OBSERVER">Observateur</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                  </div>
                  <button type="submit" [disabled]="mf.invalid">Inviter</button>
                </div>
                <small>La personne doit déjà avoir un compte PMT.</small>
              </form>
            }
          </aside>
        </div>
      </div>
    } @else if (loadError()) {
      <div class="empty" style="padding-top:6rem">
        <h1>Projet introuvable</h1>
        <p class="muted">Il n'existe pas, ou vous n'en êtes pas membre.</p>
        <a routerLink="/projects">← Mes projets</a>
      </div>
    }
  `,
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly projectId = this.route.snapshot.paramMap.get('projectId')!;

  readonly project = signal<Project | null>(null);
  readonly members = signal<Member[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly error = signal<string | null>(null);
  readonly loadError = signal(false);
  readonly showTaskForm = signal(false);
  readonly filter = signal<TaskFilter>('all');

  readonly isAdmin = computed(() => this.project()?.myRole === 'ADMIN');
  readonly canWrite = computed(() => {
    const r = this.project()?.myRole;
    return r === 'ADMIN' || r === 'MEMBER';
  });
  readonly doneCount = computed(() => this.tasks().filter((t) => t.status === 'DONE').length);
  readonly visibleTasks = computed(() => {
    const all = this.tasks();
    if (this.filter() === 'late') return all.filter((t) => isOverdue(t.dueDate, t.status));
    if (this.filter() === 'mine') {
      const me = this.members().find((m) => m.email === this.myEmail);
      return me ? all.filter((t) => t.assigneeId === me.userId) : [];
    }
    return all;
  });

  private readonly myEmail = JSON.parse(localStorage.getItem('pmt.user') ?? '{}')?.email ?? '';

  readonly frDate = frDate;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  taskName = '';
  taskDescription = '';
  taskDueDate = '';
  taskPriority: TaskPriority = 'MEDIUM';
  taskAssigneeId = '';
  inviteEmail = '';
  inviteRole: ProjectRole = 'MEMBER';

  constructor() {
    this.reload();
  }

  roleLabel(r: ProjectRole) { return ROLE_LABEL[r]; }
  priorityLabel(p: TaskPriority) { return PRIORITY_LABEL[p]; }
  statusLabel(s: Task['status']) { return STATUS_LABEL[s]; }
  late(t: Task) { return isOverdue(t.dueDate, t.status); }
  initialsOf(name: string | null): string {
    const [a, b] = (name ?? '').split(' ');
    return initials(a ?? '', b ?? '');
  }

  createTask(): void {
    this.error.set(null);
    this.taskService.create(this.projectId, {
      name: this.taskName,
      description: this.taskDescription || null,
      dueDate: this.taskDueDate || null,
      priority: this.taskPriority,
      assigneeId: this.taskAssigneeId || null,
    }).subscribe({
      next: () => {
        this.taskName = ''; this.taskDescription = ''; this.taskDueDate = ''; this.taskAssigneeId = '';
        this.showTaskForm.set(false);
        this.reloadTasks();
      },
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Création impossible'),
    });
  }

  invite(): void {
    this.error.set(null);
    this.projectService.invite(this.projectId, this.inviteEmail, this.inviteRole).subscribe({
      next: () => { this.inviteEmail = ''; this.reloadMembers(); },
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Invitation impossible'),
    });
  }

  changeRole(member: Member, role: ProjectRole): void {
    this.error.set(null);
    this.projectService.changeRole(this.projectId, member.userId, role).subscribe({
      next: () => this.reloadMembers(),
      error: (e) => {
        this.error.set((e.error as ApiError)?.message ?? 'Changement de rôle impossible');

        this.reloadMembers();
      },
    });
  }

  private reload(): void {
    this.projectService.getOne(this.projectId).subscribe({
      next: (p) => { this.project.set(p); this.reloadMembers(); this.reloadTasks(); },
      error: () => this.loadError.set(true),
    });
  }
  private reloadMembers(): void {
    this.projectService.members(this.projectId).subscribe({ next: (m) => this.members.set(m) });
  }
  private reloadTasks(): void {
    this.projectService.tasks(this.projectId).subscribe({ next: (t) => this.tasks.set(t) });
  }
}
