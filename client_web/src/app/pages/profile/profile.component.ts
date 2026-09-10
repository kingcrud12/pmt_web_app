import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TaskWithProject, WorkloadService, assignedTo, lateTasks } from '../../core/aggregate';
import { ProjectResponse, ProjectRole, TaskPriority, TaskStatus } from '../../core/models';
import { PRIORITY_LABEL, ROLE_LABEL, STATUS_LABEL, frDate } from '../../core/ui/labels';
import { avatarColor, initials } from '../../core/ui/initials';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: '../page.css',
  styles: [`
    .identity { display: flex; align-items: center; gap: 18px; }
    .identity .big {
      width: 72px; height: 72px; border-radius: 50%; color: #fff;
      font-size: 26px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .identity h1 { font-size: 30px; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
    .tile { background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius);
            padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
    .tile .n { font-family: var(--mono); font-size: 26px; font-weight: 500; line-height: 1.1; }
    .tile.alert { border-color: var(--signal); } .tile.alert .n { color: var(--signal); }
    .roles { display: flex; flex-direction: column; gap: 10px; }
    .role-line { display: flex; align-items: center; gap: 10px; }
    .role-line .track { flex-grow: 1; height: 8px; border-radius: 4px; background: var(--rule-soft); overflow: hidden; }
    .role-line .track > span { display: block; height: 100%; }
  `],
  template: `
    @if (auth.user(); as u) {
      <header class="page-head">
        <div class="head-text identity">
          <span class="big" [style.background]="avatarColor(u.id)">{{ initials(u.firstName, u.lastName) }}</span>
          <div style="display:flex; flex-direction:column; gap:3px; min-width:0">
            <h1>{{ u.firstName }} {{ u.lastName }}</h1>
            <p class="sub">{{ u.email }}</p>
            <p class="mono muted" style="font-size:11.5px">
              Compte créé le {{ u.createdAt | date: 'dd/MM/yyyy' }}
            </p>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="secondary" (click)="auth.logout()">Se déconnecter</button>
        </div>
      </header>

      <div class="body">
        <div class="tiles" style="margin-bottom:28px">
          <div class="tile"><span class="n">{{ projects().length }}</span><span class="label">Projets</span></div>
          <div class="tile"><span class="n">{{ adminCount() }}</span><span class="label">Où je suis admin</span></div>
          <div class="tile"><span class="n">{{ mine().length }}</span><span class="label">Tâches assignées</span></div>
          <div class="tile" [class.alert]="myLate().length > 0">
            <span class="n">{{ myLate().length }}</span><span class="label">Dont en retard</span>
          </div>
        </div>

        <div class="columns">
          <section>
            <div class="section-head">
              <h2>Mes tâches</h2>
              <span class="grow"></span>
              <span class="mono muted" style="font-size:12px">{{ mine().length }}</span>
            </div>
            @if (loading()) {
              <p class="muted">Chargement…</p>
            } @else if (mine().length === 0) {
              <div class="panel"><p class="sub">Aucune tâche ne vous est assignée pour l'instant.</p></div>
            } @else {
              <div class="list">
                @for (t of mine(); track t.task.id) {
                  <a class="task" [routerLink]="['/tasks', t.task.id]">
                    <span class="chips">
                      <span class="chip" [class]="'prio-' + t.task.priority.toLowerCase()">{{ priorityLabel(t.task.priority) }}</span>
                      <span class="chip" [class]="'status-' + t.task.status.toLowerCase()">{{ statusLabel(t.task.status) }}</span>
                    </span>
                    <span class="name truncate">
                      {{ t.task.name }}
                      <span class="muted" style="font-weight:400"> · {{ t.project.name }}</span>
                    </span>
                    <span class="due" [class.late]="isLate(t)">{{ frDate(t.task.dueDate) }}</span>
                  </a>
                }
              </div>
            }
          </section>

          <aside>
            <div class="section-head"><h2>Mes rôles</h2></div>
            <div class="panel roles" style="margin-bottom:16px">
              @for (r of roles; track r) {
                <div class="role-line">
                  <span class="chip" [class]="'role-' + r.toLowerCase()">{{ roleLabel(r) }}</span>
                  <span class="track"><span [style.width.%]="rolePercent(r)" [style.background]="roleColor(r)"></span></span>
                  <span class="mono" style="font-size:12.5px; min-width:20px; text-align:right">{{ roleCount(r) }}</span>
                </div>
              }
            </div>

            <div class="section-head"><h2>Mes projets</h2></div>
            <div class="members">
              @for (p of projects(); track p.id) {
                <div class="member">
                  <span class="dot" [style.background]="roleColor(p.myRole)"></span>
                  <div class="who">
                    <a [routerLink]="['/projects', p.id]" class="name truncate">{{ p.name }}</a>
                    <span class="mail truncate">{{ p.memberCount }} membre{{ p.memberCount > 1 ? 's' : '' }} · {{ p.doneTaskCount }}/{{ p.taskCount }} tâches</span>
                  </div>
                  <span class="chip" [class]="'role-' + p.myRole.toLowerCase()">{{ roleLabel(p.myRole) }}</span>
                </div>
              } @empty {
                <div class="member"><span class="sub">Aucun projet.</span></div>
              }
            </div>

            <div class="panel" style="margin-top:16px">
              <span class="label">Sécurité</span>
              <p class="sub">Votre mot de passe est stocké haché (BCrypt, 60 caractères) — il n'est jamais
                 renvoyé par l'API, ni dans les réponses ni dans les journaux.</p>
              <small>La modification du profil et du mot de passe n'est pas encore exposée par l'API.</small>
            </div>
          </aside>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly workloadService = inject(WorkloadService);

  readonly projects = signal<ProjectResponse[]>([]);
  readonly tasks = signal<TaskWithProject[]>([]);
  readonly loading = signal(true);

  readonly roles: ProjectRole[] = ['ADMIN', 'MEMBER', 'OBSERVER'];
  readonly frDate = frDate;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  readonly mine = computed(() => {
    const id = this.auth.user()?.id;
    return id ? assignedTo(this.tasks(), id) : [];
  });
  readonly myLate = computed(() => {
    const ids = new Set(lateTasks(this.tasks()).map((t) => t.task.id));
    return this.mine().filter((t) => ids.has(t.task.id));
  });
  readonly adminCount = computed(() => this.projects().filter((p) => p.myRole === 'ADMIN').length);

  constructor() {
    this.workloadService.load().subscribe({
      next: (w) => { this.projects.set(w.projects); this.tasks.set(w.tasks); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  roleLabel(r: ProjectRole) { return ROLE_LABEL[r]; }
  priorityLabel(p: TaskPriority) { return PRIORITY_LABEL[p]; }
  statusLabel(s: TaskStatus) { return STATUS_LABEL[s]; }
  roleCount(r: ProjectRole) { return this.projects().filter((p) => p.myRole === r).length; }
  rolePercent(r: ProjectRole) {
    const total = this.projects().length;
    return total === 0 ? 0 : Math.round((this.roleCount(r) / total) * 100);
  }
  roleColor(r: ProjectRole) {
    return { ADMIN: '#4A3F7A', MEMBER: '#14555F', OBSERVER: '#8E9089' }[r];
  }
  isLate(t: TaskWithProject) {
    return this.myLate().some((l) => l.task.id === t.task.id);
  }
}
