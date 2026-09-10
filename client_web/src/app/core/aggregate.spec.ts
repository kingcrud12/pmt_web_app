import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskWithProject, WorkloadService, assignedTo, countByStatus, lateTasks } from './aggregate';
import { ProjectResponse, TaskResponse } from './models';

function projet(id: string, name: string): ProjectResponse {
  return {
    id, name, description: null, startDate: '2026-09-01', createdAt: '2026-09-01T08:00:00Z',
    myRole: 'ADMIN', memberCount: 1, taskCount: 1, doneTaskCount: 0,
  };
}

function tache(id: string, projectId: string, over: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id, projectId, name: 'Tache ' + id, description: null, dueDate: null, endDate: null,
    priority: 'MEDIUM', status: 'TODO', assigneeId: null, assigneeName: null,
    createdAt: '2026-09-01T08:00:00Z', updatedAt: null, ...over,
  };
}

const HIER = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

describe('WorkloadService', () => {
  let service: WorkloadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WorkloadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('n interroge aucune tache quand il n y a pas de projet', () => {
    service.load().subscribe((w) => {
      expect(w.projects).toEqual([]);
      expect(w.tasks).toEqual([]);
    });
    http.expectOne('/api/projects').flush([]);
    http.expectNone('/api/projects/x/tasks');
  });

  it('rassemble les taches de tous les projets', () => {
    let recu: { tasks: TaskWithProject[] } | undefined;
    service.load().subscribe((w) => (recu = w));

    http.expectOne('/api/projects').flush([projet('p1', 'Un'), projet('p2', 'Deux')]);
    http.expectOne('/api/projects/p1/tasks').flush([tache('t1', 'p1')]);
    http.expectOne('/api/projects/p2/tasks').flush([tache('t2', 'p2'), tache('t3', 'p2')]);

    expect(recu!.tasks.length).toBe(3);
    expect(recu!.tasks.map((t) => t.project.name)).toEqual(['Un', 'Deux', 'Deux']);
  });
});

describe('agregations', () => {
  const p = projet('p1', 'Un');
  const tasks: TaskWithProject[] = [
    { task: tache('t1', 'p1', { status: 'DONE' }), project: p },
    { task: tache('t2', 'p1', { status: 'TODO', dueDate: HIER }), project: p },
    { task: tache('t3', 'p1', { status: 'DONE', dueDate: HIER }), project: p },
    { task: tache('t4', 'p1', { assigneeId: 'moi' }), project: p },
  ];

  it('compte par statut', () => {
    expect(countByStatus(tasks, 'DONE')).toBe(2);
    expect(countByStatus(tasks, 'TODO')).toBe(2);
    expect(countByStatus(tasks, 'IN_PROGRESS')).toBe(0);
  });

  it('ne compte jamais une tache terminee comme en retard', () => {
    const late = lateTasks(tasks);
    expect(late.length).toBe(1);
    expect(late[0].task.id).toBe('t2');
  });

  it('filtre les taches assignees a une personne', () => {
    expect(assignedTo(tasks, 'moi').map((t) => t.task.id)).toEqual(['t4']);
    expect(assignedTo(tasks, 'quelqu-un-dautre')).toEqual([]);
  });
});
