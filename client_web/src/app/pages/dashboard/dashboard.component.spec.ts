import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { ProjectResponse, TaskResponse } from '../../core/models';

const HIER = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

const PROJET: ProjectResponse = {
  id: 'p1', name: 'Refonte du site', description: null, startDate: '2026-09-15',
  createdAt: '2026-09-01T08:00:00Z', myRole: 'ADMIN', memberCount: 3, taskCount: 3, doneTaskCount: 1,
};

function tache(id: string, over: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id, projectId: 'p1', name: 'Tache ' + id, description: null, dueDate: null, endDate: null,
    priority: 'MEDIUM', status: 'TODO', assigneeId: null, assigneeName: null,
    createdAt: '2026-09-01T08:00:00Z', updatedAt: null, ...over,
  };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('pmt.user', JSON.stringify({
      id: 'moi', firstName: 'Alice', lastName: 'Durand', email: 'a@b.fr', createdAt: '',
    }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  function charger(taches: TaskResponse[]) {
    http.expectOne('/api/projects').flush([PROJET]);
    http.expectOne('/api/projects/p1/tasks').flush(taches);
    fixture.detectChanges();
  }

  it('invite a creer un projet quand il n y en a aucun', () => {
    http.expectOne('/api/projects').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rien à afficher');
  });

  it('compte les taches, celles qui me sont assignees et les retards', () => {
    charger([
      tache('t1', { status: 'DONE' }),
      tache('t2', { status: 'TODO', dueDate: HIER }),
      tache('t3', { assigneeId: 'moi' }),
    ]);

    const c = fixture.componentInstance;
    expect(c.workload().tasks.length).toBe(3);
    expect(c.mine().length).toBe(1);
    expect(c.late().length).toBe(1);
    expect(c.count('DONE')).toBe(1);
  });

  it('remonte d abord les retards, puis les priorites hautes', () => {
    charger([
      tache('t1', { priority: 'HIGH', status: 'TODO' }),
      tache('t2', { status: 'TODO', dueDate: HIER }),
      tache('t3', { priority: 'HIGH', status: 'DONE' }),
    ]);

    const urgent = fixture.componentInstance.urgent();
    expect(urgent[0].task.id).toBe('t2');
    expect(urgent.map((u) => u.task.id)).not.toContain('t3');
  });

  it('calcule un pourcentage par statut sans diviser par zero', () => {
    charger([]);
    expect(fixture.componentInstance.percent('DONE')).toBe(0);
  });
});
