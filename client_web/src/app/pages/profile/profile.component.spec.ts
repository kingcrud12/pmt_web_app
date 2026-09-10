import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProfileComponent } from './profile.component';
import { ProjectResponse, TaskResponse } from '../../core/models';

function projet(id: string, role: ProjectResponse['myRole']): ProjectResponse {
  return {
    id, name: 'Projet ' + id, description: null, startDate: '2026-09-01',
    createdAt: '2026-09-01T08:00:00Z', myRole: role, memberCount: 2, taskCount: 1, doneTaskCount: 0,
  };
}

function tache(id: string, projectId: string, assigneeId: string | null): TaskResponse {
  return {
    id, projectId, name: 'Tache ' + id, description: null, dueDate: null, endDate: null,
    priority: 'MEDIUM', status: 'TODO', assigneeId, assigneeName: null,
    createdAt: '2026-09-01T08:00:00Z', updatedAt: null,
  };
}

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.setItem('pmt.user', JSON.stringify({
      id: 'moi', firstName: 'Yann', lastName: 'Dipita',
      email: 'yann@pmt.fr', createdAt: '2026-09-10T08:00:00Z',
    }));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/projects').flush([projet('p1', 'ADMIN'), projet('p2', 'OBSERVER')]);
    http.expectOne('/api/projects/p1/tasks').flush([tache('t1', 'p1', 'moi')]);
    http.expectOne('/api/projects/p2/tasks').flush([tache('t2', 'p2', 'quelqu-un')]);
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('affiche l identite et les initiales', () => {
    expect(fixture.nativeElement.textContent).toContain('Yann Dipita');
    expect(fixture.nativeElement.textContent).toContain('yann@pmt.fr');
    expect(fixture.nativeElement.querySelector('.big').textContent.trim()).toBe('YD');
  });

  it('ne retient que les taches qui me sont assignees', () => {
    const c = fixture.componentInstance;
    expect(c.mine().length).toBe(1);
    expect(c.mine()[0].task.id).toBe('t1');
  });

  it('compte les projets par role', () => {
    const c = fixture.componentInstance;
    expect(c.adminCount()).toBe(1);
    expect(c.roleCount('OBSERVER')).toBe(1);
    expect(c.roleCount('MEMBER')).toBe(0);
    expect(c.rolePercent('ADMIN')).toBe(50);
  });
});
