import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/project.service';
import { TaskService } from '../../core/task.service';
import { ApiError, Member, Project, ProjectRole, Task, TaskPriority } from '../../core/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (project(); as p) {
      <header class="page-head">
        <div>
          <a routerLink="/projects" class="back">← Mes projets</a>
          <h1>{{ p.name }}</h1>
          <p class="sub">{{ p.description || 'Sans description' }} · début {{ p.startDate }}</p>
        </div>
        <span class="badge" [class]="'role-' + p.myRole.toLowerCase()">{{ roleLabel(p.myRole) }}</span>
      </header>

      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <div class="columns">
        <section>
          <h2>Tâches</h2>

          <!-- Le formulaire est masqué pour un observateur. Le serveur refuse
               de toute façon la création : ceci n'est que du confort. -->
          @if (canWrite()) {
            <form class="panel" (ngSubmit)="createTask()" #tf="ngForm">
              <label for="tname">Nom de la tâche</label>
              <input id="tname" name="tname" [(ngModel)]="taskName" required maxlength="250" />

              <label for="tdesc">Description</label>
              <textarea id="tdesc" name="tdesc" [(ngModel)]="taskDescription" rows="2"></textarea>

              <div class="row">
                <div>
                  <label for="tdue">Échéance</label>
                  <input id="tdue" name="tdue" type="date" [(ngModel)]="taskDueDate" />
                </div>
                <div>
                  <label for="tprio">Priorité</label>
                  <select id="tprio" name="tprio" [(ngModel)]="taskPriority">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>
                <div>
                  <label for="tassignee">Assigné à</label>
                  <select id="tassignee" name="tassignee" [(ngModel)]="taskAssigneeId">
                    <option value="">Personne</option>
                    @for (m of members(); track m.userId) {
                      <option [value]="m.userId">{{ m.firstName }} {{ m.lastName }}</option>
                    }
                  </select>
                </div>
              </div>

              <button type="submit" [disabled]="tf.invalid">Créer la tâche</button>
            </form>
          }

          @if (tasks().length === 0) {
            <p class="muted">Aucune tâche pour l'instant.</p>
          } @else {
            <ul class="tasks">
              @for (t of tasks(); track t.id) {
                <li>
                  <a [routerLink]="['/tasks', t.id]">
                    <span class="chip" [class]="'prio-' + t.priority.toLowerCase()">{{ priorityLabel(t.priority) }}</span>
                    <span class="chip" [class]="'status-' + t.status.toLowerCase()">{{ statusLabel(t.status) }}</span>
                    <strong>{{ t.name }}</strong>
                    <span class="meta">
                      {{ t.assigneeName || 'Non assignée' }}@if (t.dueDate) { · échéance {{ t.dueDate }} }
                    </span>
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <aside>
          <h2>Membres ({{ members().length }})</h2>

          @if (isAdmin()) {
            <form class="panel" (ngSubmit)="invite()" #mf="ngForm">
              <label for="invEmail">Inviter par e-mail</label>
              <input id="invEmail" name="invEmail" type="email" [(ngModel)]="inviteEmail" required />

              <label for="invRole">Rôle</label>
              <select id="invRole" name="invRole" [(ngModel)]="inviteRole">
                <option value="MEMBER">Membre</option>
                <option value="OBSERVER">Observateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>

              <button type="submit" [disabled]="mf.invalid">Inviter</button>
            </form>
          }

          <ul class="members">
            @for (m of members(); track m.userId) {
              <li>
                <div>
                  <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                  <span class="meta">{{ m.email }}</span>
                </div>
                @if (isAdmin()) {
                  <select [ngModel]="m.role" (ngModelChange)="changeRole(m, $event)"
                          [name]="'role-' + m.userId">
                    <option value="ADMIN">Administrateur</option>
                    <option value="MEMBER">Membre</option>
                    <option value="OBSERVER">Observateur</option>
                  </select>
                } @else {
                  <span class="badge" [class]="'role-' + m.role.toLowerCase()">{{ roleLabel(m.role) }}</span>
                }
              </li>
            }
          </ul>
        </aside>
      </div>
    } @else if (loadError()) {
      <div class="empty">
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

  readonly isAdmin = computed(() => this.project()?.myRole === 'ADMIN');
  readonly canWrite = computed(() => {
    const role = this.project()?.myRole;
    return role === 'ADMIN' || role === 'MEMBER';
  });

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

  roleLabel(role: string): string {
    return { ADMIN: 'Administrateur', MEMBER: 'Membre', OBSERVER: 'Observateur' }[role] ?? role;
  }
  priorityLabel(p: string): string {
    return { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' }[p] ?? p;
  }
  statusLabel(s: string): string {
    return { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée' }[s] ?? s;
  }

  createTask(): void {
    this.error.set(null);
    this.taskService
      .create(this.projectId, {
        name: this.taskName,
        description: this.taskDescription || null,
        dueDate: this.taskDueDate || null,
        priority: this.taskPriority,
        assigneeId: this.taskAssigneeId || null,
      })
      .subscribe({
        next: () => {
          this.taskName = '';
          this.taskDescription = '';
          this.taskDueDate = '';
          this.taskAssigneeId = '';
          this.reloadTasks();
        },
        error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Création impossible'),
      });
  }

  invite(): void {
    this.error.set(null);
    this.projectService.invite(this.projectId, this.inviteEmail, this.inviteRole).subscribe({
      next: () => {
        this.inviteEmail = '';
        this.reloadMembers();
      },
      error: (e) => this.error.set((e.error as ApiError)?.message ?? 'Invitation impossible'),
    });
  }

  changeRole(member: Member, role: ProjectRole): void {
    this.error.set(null);
    this.projectService.changeRole(this.projectId, member.userId, role).subscribe({
      next: () => this.reloadMembers(),
      error: (e) => {
        this.error.set((e.error as ApiError)?.message ?? 'Changement de rôle impossible');
        // Le serveur a refusé : on remet la liste dans son état réel.
        this.reloadMembers();
      },
    });
  }

  private reload(): void {
    this.projectService.getOne(this.projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        this.reloadMembers();
        this.reloadTasks();
      },
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
