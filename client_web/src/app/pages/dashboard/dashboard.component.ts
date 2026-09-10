import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TaskWithProject, WorkloadService, assignedTo, countByStatus, lateTasks } from '../../core/aggregate';
import { ProjectResponse, TaskPriority, TaskStatus } from '../../core/models';
import { PRIORITY_LABEL, STATUS_LABEL, frDate } from '../../core/ui/labels';
import { avatarColor } from '../../core/ui/initials';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrl: '../page.css',
  styles: [`
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }
    .tile { background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius);
            padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
    .tile .n { font-family: var(--mono); font-size: 28px; font-weight: 500; line-height: 1.1; }
    .tile.alert { border-color: var(--signal); }
    .tile.alert .n { color: var(--signal); }
    .bars { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 130px minmax(0, 1fr) 44px; gap: 12px; align-items: center; }
    .track { height: 8px; border-radius: 4px; background: var(--rule-soft); overflow: hidden; }
    .track > span { display: block; height: 100%; }
  `],
  template: `
    <header class="page-head">
      <div class="head-text">
        <h1>Tableau de bord</h1>
        <p class="sub">Vue d'ensemble de vos {{ workload().projects.length }} projet{{ workload().projects.length > 1 ? 's' : '' }}.</p>
      </div>
      <div class="actions">
        <a class="btn" routerLink="/projects">Voir les projets</a>
      </div>
    </header>

    <div class="body">
      @if (loading()) {
        <p class="muted">Chargement…</p>
      } @else if (workload().projects.length === 0) {
        <div class="empty">
          <h2>Rien à afficher pour l'instant</h2>
          <p class="muted">Créez un projet, ou demandez à être invité sur un projet existant.</p>
          <a routerLink="/projects">Créer un projet →</a>
        </div>
      } @else {
        <div class="tiles">
          <div class="tile">
            <span class="n">{{ workload().projects.length }}</span>
            <span class="label">Projets</span>
          </div>
          <div class="tile">
            <span class="n">{{ workload().tasks.length }}</span>
            <span class="label">Tâches au total</span>
          </div>
          <div class="tile">
            <span class="n">{{ mine().length }}</span>
            <span class="label">Assignées à moi</span>
          </div>
          <div class="tile" [class.alert]="late().length > 0">
            <span class="n">{{ late().length }}</span>
            <span class="label">En retard</span>
          </div>
        </div>

        <div class="columns">
          <section>
            <div class="section-head"><h2>Répartition des tâches</h2></div>
            <div class="panel bars">
              @for (s of statuses; track s) {
                <div class="bar-row">
                  <span class="chip" [class]="'status-' + s.toLowerCase()">{{ statusLabel(s) }}</span>
                  <span class="track"><span [style.width.%]="percent(s)" [style.background]="statusColor(s)"></span></span>
                  <span class="mono" style="font-size:12.5px; text-align:right">{{ count(s) }}</span>
                </div>
              }
            </div>

            <div class="section-head" style="margin-top:28px">
              <h2>À traiter en priorité</h2>
              <span class="grow"></span>
              <span class="mono muted" style="font-size:12px">{{ urgent().length }}</span>
            </div>
            @if (urgent().length === 0) {
              <div class="panel"><p class="sub">Rien d'urgent : aucune tâche en retard ni de priorité haute non terminée.</p></div>
            } @else {
              <div class="list">
                @for (t of urgent().slice(0, 8); track t.task.id) {
                  <a class="task" [routerLink]="['/tasks', t.task.id]">
                    <span class="chips">
                      <span class="chip" [class]="'prio-' + t.task.priority.toLowerCase()">{{ priorityLabel(t.task.priority) }}</span>
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
            <div class="section-head"><h2>Avancement par projet</h2></div>
            <div class="panel bars">
              @for (p of workload().projects; track p.id) {
                <div style="display:flex; flex-direction:column; gap:6px">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; gap:10px">
                    <a [routerLink]="['/projects', p.id]" class="truncate" style="font-size:13.5px; font-weight:600">{{ p.name }}</a>
                    <span class="mono muted" style="font-size:11.5px; flex-shrink:0">{{ p.doneTaskCount }}/{{ p.taskCount }}</span>
                  </div>
                  <div class="progress"><span [style.width.%]="projectPercent(p)"></span></div>
                </div>
              }
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  private readonly workloadService = inject(WorkloadService);
  private readonly auth = inject(AuthService);

  readonly workload = signal<{ projects: ProjectResponse[]; tasks: TaskWithProject[] }>({ projects: [], tasks: [] });
  readonly loading = signal(true);

  readonly statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  readonly frDate = frDate;

  readonly late = computed(() => lateTasks(this.workload().tasks));
  readonly mine = computed(() => {
    const id = this.auth.user()?.id;
    return id ? assignedTo(this.workload().tasks, id) : [];
  });

  readonly urgent = computed(() => {
    const late = this.late();
    const lateIds = new Set(late.map((t) => t.task.id));
    const high = this.workload().tasks.filter(
      (t) => t.task.priority === 'HIGH' && t.task.status !== 'DONE' && !lateIds.has(t.task.id)
    );
    return [...late, ...high];
  });

  constructor() {
    this.workloadService.load().subscribe({
      next: (w) => { this.workload.set(w); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: TaskStatus) { return STATUS_LABEL[s]; }
  priorityLabel(p: TaskPriority) { return PRIORITY_LABEL[p]; }
  count(s: TaskStatus) { return countByStatus(this.workload().tasks, s); }
  percent(s: TaskStatus) {
    const total = this.workload().tasks.length;
    return total === 0 ? 0 : Math.round((this.count(s) / total) * 100);
  }
  statusColor(s: TaskStatus) {
    return { TODO: '#8E9089', IN_PROGRESS: '#14555F', DONE: '#3E6B4C' }[s];
  }
  projectPercent(p: ProjectResponse) {
    return p.taskCount === 0 ? 0 : Math.round((p.doneTaskCount / p.taskCount) * 100);
  }
  isLate(t: TaskWithProject) {
    return this.late().some((l) => l.task.id === t.task.id);
  }
}
