import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectsComponent } from './projects.component';
import { ProjectResponse } from '../../core/models';

const PROJETS: ProjectResponse[] = [
  { id: 'p1', name: 'Refonte du site', description: 'Angular 19', startDate: '2026-09-15',
    createdAt: '2026-09-01T08:00:00Z', myRole: 'ADMIN', memberCount: 3, taskCount: 12, doneTaskCount: 7 },
  { id: 'p2', name: 'Audit securite', description: null, startDate: '2026-09-22',
    createdAt: '2026-09-01T08:00:00Z', myRole: 'OBSERVER', memberCount: 4, taskCount: 0, doneTaskCount: 0 },
];

describe('ProjectsComponent', () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush(PROJETS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('affiche une carte par projet', () => {
    expect(fixture.nativeElement.querySelectorAll('.card').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Refonte du site');
  });

  it('remplace une description absente par un texte de repli', () => {
    expect(fixture.nativeElement.textContent).toContain('Sans description');
  });

  it('calcule l avancement, et evite la division par zero', () => {
    const c = fixture.componentInstance;
    expect(c.percent(PROJETS[0])).toBe(58);
    expect(c.percent(PROJETS[1])).toBe(0);
  });

  it('filtre sur les projets dont on est administrateur', () => {
    const c = fixture.componentInstance;
    expect(c.adminCount()).toBe(1);

    c.filter.set('admin');
    fixture.detectChanges();

    expect(c.visible().length).toBe(1);
    expect(c.visible()[0].name).toBe('Refonte du site');
  });

  it('cree un projet puis recharge la liste', () => {
    const c = fixture.componentInstance;
    c.name = 'Nouveau projet';
    c.description = 'Description';
    c.startDate = '2026-10-01';
    c.create();

    const post = http.expectOne((r) => r.url === '/api/projects' && r.method === 'POST');
    expect(post.request.body.name).toBe('Nouveau projet');
    post.flush(PROJETS[0]);

    http.expectOne((r) => r.url === '/api/projects' && r.method === 'GET').flush(PROJETS);
    expect(c.showForm()).toBeFalse();
  });

  it('affiche le message du serveur si la creation echoue', () => {
    const c = fixture.componentInstance;
    c.name = 'X'; c.startDate = '2026-10-01';
    c.create();

    http.expectOne((r) => r.method === 'POST').flush(
      { message: 'Requete invalide' }, { status: 400, statusText: 'Bad Request' });

    expect(c.error()).toBe('Requete invalide');
  });
});
