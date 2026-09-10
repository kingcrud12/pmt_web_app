import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetailComponent } from './project-detail.component';
import { MemberResponse, ProjectResponse, ProjectRole, TaskResponse } from '../../core/models';

const HIER = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

function projet(role: ProjectRole): ProjectResponse {
  return {
    id: 'p1', name: 'Refonte du site', description: 'Angular 19', startDate: '2026-09-15',
    createdAt: '2026-09-01T08:00:00Z', myRole: role, memberCount: 2, taskCount: 2, doneTaskCount: 1,
  };
}

const MEMBRES: MemberResponse[] = [
  { userId: 'u1', firstName: 'Alice', lastName: 'Durand', email: 'alice@pmt.fr', role: 'ADMIN', joinedAt: '' },
  { userId: 'u2', firstName: 'Bob', lastName: 'Membre', email: 'bob@pmt.fr', role: 'MEMBER', joinedAt: '' },
];

function tache(id: string, over: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id, projectId: 'p1', name: 'Tache ' + id, description: null, dueDate: null, endDate: null,
    priority: 'MEDIUM', status: 'TODO', assigneeId: null, assigneeName: null,
    createdAt: '2026-09-01T08:00:00Z', updatedAt: null, ...over,
  };
}

async function monter(role: ProjectRole, taches: TaskResponse[] = []) {
  await TestBed.configureTestingModule({
    imports: [ProjectDetailComponent],
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'p1' } } } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProjectDetailComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  http.expectOne('/api/projects/p1').flush(projet(role));
  http.expectOne('/api/projects/p1/members').flush(MEMBRES);
  http.expectOne('/api/projects/p1/tasks').flush(taches);
  fixture.detectChanges();
  return { fixture, http };
}

describe('ProjectDetailComponent', () => {
  afterEach(() => localStorage.clear());

  it('affiche le projet, ses membres et ses taches', async () => {
    const { fixture, http } = await monter('ADMIN', [tache('t1')]);
    expect(fixture.nativeElement.textContent).toContain('Refonte du site');
    expect(fixture.nativeElement.querySelectorAll('.member').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.task').length).toBe(1);
    http.verify();
  });

  it('ouvre l invitation et le formulaire de tache pour un administrateur', async () => {
    const { fixture, http } = await monter('ADMIN');
    expect(fixture.componentInstance.isAdmin()).toBeTrue();
    expect(fixture.componentInstance.canWrite()).toBeTrue();
    http.verify();
  });

  it('cache l invitation a un membre simple', async () => {
    const { fixture, http } = await monter('MEMBER');
    expect(fixture.componentInstance.isAdmin()).toBeFalse();
    expect(fixture.componentInstance.canWrite()).toBeTrue();
    http.verify();
  });

  it('interdit toute ecriture a un observateur', async () => {
    const { fixture, http } = await monter('OBSERVER');
    expect(fixture.componentInstance.canWrite()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Nouvelle tâche');
    http.verify();
  });

  it('filtre les taches en retard sans compter les terminees', async () => {
    const { fixture, http } = await monter('ADMIN', [
      tache('t1', { dueDate: HIER, status: 'TODO' }),
      tache('t2', { dueDate: HIER, status: 'DONE' }),
    ]);
    const c = fixture.componentInstance;
    c.filter.set('late');
    expect(c.visibleTasks().length).toBe(1);
    expect(c.visibleTasks()[0].id).toBe('t1');
    http.verify();
  });

  it('cree une tache puis recharge la liste', async () => {
    const { fixture, http } = await monter('ADMIN');
    const c = fixture.componentInstance;
    c.taskName = 'Nouvelle tache';
    c.createTask();

    const post = http.expectOne((r) => r.url === '/api/projects/p1/tasks' && r.method === 'POST');
    expect(post.request.body.name).toBe('Nouvelle tache');
    post.flush(tache('t9'));
    http.expectOne((r) => r.url === '/api/projects/p1/tasks' && r.method === 'GET').flush([tache('t9')]);

    expect(c.taskName).toBe('');
    http.verify();
  });

  it('remet la liste en etat quand le serveur refuse un changement de role', async () => {
    const { fixture, http } = await monter('ADMIN');
    const c = fixture.componentInstance;
    c.changeRole(MEMBRES[0], 'MEMBER');

    http.expectOne((r) => r.method === 'PUT').flush(
      { message: 'Le projet doit conserver au moins un administrateur' },
      { status: 403, statusText: 'Forbidden' });
    http.expectOne('/api/projects/p1/members').flush(MEMBRES);

    expect(c.error()).toContain('au moins un administrateur');
    http.verify();
  });

  it('signale un projet introuvable', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'inconnu' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectDetailComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects/inconnu').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Projet introuvable');
    http.verify();
  });
});
