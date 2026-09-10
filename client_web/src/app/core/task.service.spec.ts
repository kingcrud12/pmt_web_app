import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { TaskResponse } from './models';

const TACHE: TaskResponse = {
  id: 'bd59a7c4-518b-4776-bd2f-27ced4da0e1a',
  projectId: '11d35d96-033f-4acd-8ccc-6f012dc21b29',
  name: 'Maquetter le tableau de bord',
  description: null,
  dueDate: '2026-10-01',
  endDate: null,
  priority: 'HIGH',
  status: 'TODO',
  assigneeId: null,
  assigneeName: null,
  createdAt: '2026-09-10T08:00:00Z',
  updatedAt: null,
};

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cree une tache sous son projet', () => {
    service.create(TACHE.projectId, {
      name: 'Nouvelle', description: null, dueDate: null, priority: 'MEDIUM', assigneeId: null,
    }).subscribe();

    const req = http.expectOne(`/api/projects/${TACHE.projectId}/tasks`);
    expect(req.request.method).toBe('POST');
    req.flush(TACHE);
  });

  it('lit une tache par son identifiant', () => {
    service.getOne(TACHE.id).subscribe((t) => expect(t.name).toBe(TACHE.name));
    const req = http.expectOne(`/api/tasks/${TACHE.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(TACHE);
  });

  it('met a jour une tache sans jamais envoyer de projectId', () => {
    service.update(TACHE.id, {
      name: 'Modifiee', description: null, dueDate: '2026-10-01', endDate: '2026-10-02',
      priority: 'LOW', status: 'DONE', assigneeId: null,
    }).subscribe();

    const req = http.expectOne(`/api/tasks/${TACHE.id}`);
    expect(req.request.method).toBe('PUT');
    // Une tache ne change jamais de projet : l'API n'accepte pas ce champ.
    expect(Object.keys(req.request.body as object)).not.toContain('projectId');
    req.flush(TACHE);
  });
});
