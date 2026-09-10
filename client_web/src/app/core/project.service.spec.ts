import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectService } from './project.service';
import { ProjectResponse } from './models';

const PROJET: ProjectResponse = {
  id: '11d35d96-033f-4acd-8ccc-6f012dc21b29',
  name: 'Refonte du site',
  description: 'Migration Angular',
  startDate: '2026-09-15',
  createdAt: '2026-09-10T08:00:00Z',
  myRole: 'ADMIN',
  memberCount: 3,
  taskCount: 12,
  doneTaskCount: 7,
};

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les projets de l utilisateur', () => {
    service.list().subscribe((ps) => expect(ps.length).toBe(1));
    const req = http.expectOne('/api/projects');
    expect(req.request.method).toBe('GET');
    req.flush([PROJET]);
  });

  it('cree un projet avec la description nulle si elle est vide', () => {
    service.create('Nouveau', '', '2026-10-01').subscribe();
    const req = http.expectOne('/api/projects');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Nouveau', description: null, startDate: '2026-10-01' });
    req.flush(PROJET);
  });

  it('invite un membre avec son role', () => {
    service.invite(PROJET.id, 'bob@pmt.fr', 'MEMBER').subscribe();
    const req = http.expectOne(`/api/projects/${PROJET.id}/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'bob@pmt.fr', role: 'MEMBER' });
    req.flush({});
  });

  it('change le role d un membre sur l URL attendue', () => {
    const userId = '93092c48-e28f-4bf6-a465-076136c59135';
    service.changeRole(PROJET.id, userId, 'ADMIN').subscribe();
    const req = http.expectOne(`/api/projects/${PROJET.id}/members/${userId}/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({});
  });

  it('recupere les taches d un projet', () => {
    service.tasks(PROJET.id).subscribe();
    const req = http.expectOne(`/api/projects/${PROJET.id}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
