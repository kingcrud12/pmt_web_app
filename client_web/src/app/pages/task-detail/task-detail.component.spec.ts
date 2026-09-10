import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskDetailComponent } from './task-detail.component';
import { ProjectRole, TaskResponse } from '../../core/models';

const TACHE: TaskResponse = {
  id: 't1', projectId: 'p1', name: 'Maquetter le tableau de bord', description: 'Figma',
  dueDate: '2026-10-01', endDate: null, priority: 'HIGH', status: 'IN_PROGRESS',
  assigneeId: 'u2', assigneeName: 'Bob Membre',
  createdAt: '2026-09-10T08:00:00Z', updatedAt: null,
};

async function monter(role: ProjectRole) {
  await TestBed.configureTestingModule({
    imports: [TaskDetailComponent],
    providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 't1' } } } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TaskDetailComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();

  http.expectOne('/api/tasks/t1').flush(TACHE);
  http.expectOne('/api/projects/p1').flush({
    id: 'p1', name: 'Refonte du site', description: null, startDate: '2026-09-15',
    createdAt: '2026-09-01T08:00:00Z', myRole: role, memberCount: 2, taskCount: 1, doneTaskCount: 0,
  });
  http.expectOne('/api/projects/p1/members').flush([]);
  fixture.detectChanges();
  return { fixture, http };
}

describe('TaskDetailComponent', () => {
  it('remplit le formulaire depuis la tache chargee', async () => {
    const { fixture, http } = await monter('MEMBER');
    const f = fixture.componentInstance.form;
    expect(f.name).toBe(TACHE.name);
    expect(f.priority).toBe('HIGH');
    expect(f.status).toBe('IN_PROGRESS');
    expect(f.assigneeId).toBe('u2');
    http.verify();
  });

  it('affiche le detail complet en lecture', async () => {
    const { fixture, http } = await monter('OBSERVER');
    const texte = fixture.nativeElement.textContent;
    expect(texte).toContain('Maquetter le tableau de bord');
    expect(texte).toContain('Bob Membre');
    expect(texte).toContain('01/10/2026');
    http.verify();
  });

  it('propose la modification a un membre', async () => {
    const { fixture, http } = await monter('MEMBER');
    expect(fixture.componentInstance.canWrite()).toBeTrue();
    expect(fixture.nativeElement.querySelector('#name')).not.toBeNull();
    http.verify();
  });

  it('refuse la modification a un observateur', async () => {
    const { fixture, http } = await monter('OBSERVER');
    expect(fixture.componentInstance.canWrite()).toBeFalse();
    expect(fixture.nativeElement.querySelector('#name')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('observateur');
    http.verify();
  });

  it('enregistre les modifications et confirme', async () => {
    const { fixture, http } = await monter('MEMBER');
    const c = fixture.componentInstance;
    c.form.name = 'Titre modifie';
    c.save();

    const put = http.expectOne('/api/tasks/t1');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.name).toBe('Titre modifie');
    put.flush({ ...TACHE, name: 'Titre modifie' });
    fixture.detectChanges();

    expect(c.saved()).toBeTrue();
    http.verify();
  });

  it('marque terminee en posant la date de fin du jour', async () => {
    const { fixture, http } = await monter('MEMBER');
    const c = fixture.componentInstance;
    c.markDone();

    const put = http.expectOne('/api/tasks/t1');
    expect(put.request.body.status).toBe('DONE');
    expect(put.request.body.endDate).toBe(new Date().toISOString().substring(0, 10));
    put.flush({ ...TACHE, status: 'DONE' });
    http.verify();
  });

  it('affiche le message du serveur si la date de fin precede l echeance', async () => {
    const { fixture, http } = await monter('MEMBER');
    const c = fixture.componentInstance;
    c.form.endDate = '2026-09-01';
    c.save();

    http.expectOne('/api/tasks/t1').flush(
      { message: "La date de fin ne peut pas preceder la date d'echeance" },
      { status: 400, statusText: 'Bad Request' });

    expect(c.error()).toContain('date de fin');
    http.verify();
  });

  it('signale une tache introuvable', async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'inconnue' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskDetailComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/tasks/inconnue').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tâche introuvable');
    http.verify();
  });
});
