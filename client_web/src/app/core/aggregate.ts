import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ProjectService } from './project.service';
import { ProjectResponse, TaskResponse, TaskStatus } from './models';
import { isOverdue } from './ui/labels';

export interface TaskWithProject {
  task: TaskResponse;
  project: ProjectResponse;
}

export interface Workload {
  projects: ProjectResponse[];
  tasks: TaskWithProject[];
}

@Injectable({ providedIn: 'root' })
export class WorkloadService {
  private readonly projectService = inject(ProjectService);

  load(): Observable<Workload> {
    return this.projectService.list().pipe(
      switchMap((projects) => {
        if (projects.length === 0) return of<Workload>({ projects: [], tasks: [] });

        return forkJoin(
          projects.map((project) =>
            this.projectService.tasks(project.id).pipe(
              map((tasks) => tasks.map((task) => ({ task, project })))
            )
          )
        ).pipe(map((lists) => ({ projects, tasks: lists.flat() })));
      })
    );
  }
}

export function countByStatus(tasks: TaskWithProject[], status: TaskStatus): number {
  return tasks.filter((t) => t.task.status === status).length;
}

export function lateTasks(tasks: TaskWithProject[]): TaskWithProject[] {
  return tasks
    .filter((t) => isOverdue(t.task.dueDate, t.task.status))
    .sort((a, b) => (a.task.dueDate ?? '').localeCompare(b.task.dueDate ?? ''));
}

export function assignedTo(tasks: TaskWithProject[], userId: string): TaskWithProject[] {
  return tasks.filter((t) => t.task.assigneeId === userId);
}
