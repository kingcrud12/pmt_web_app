import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SidebarComponent } from './sidebar.component';
import { ProjectResponse } from '../models';

const PROJETS: ProjectResponse[] = [
  { id: 'p1', name: 'Refonte du site', description: null, startDate: '2026-09-15',
    createdAt: '2026-09-01T08:00:00Z', myRole: 'ADMIN', memberCount: 3, taskCount: 4, doneTaskCount: 1 },
  { id: 'p2', name: 'Migration MySQL', description: null, startDate: '2026-09-01',
    createdAt: '2026-09-01T08:00:00Z', myRole: 'OBSERVER', memberCount: 2, taskCount: 2, doneTaskCount: 2 },
];

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('pmt.user', JSON.stringify({
      id: '1', firstName: 'Alice', lastName: 'Durand', email: 'alice@pmt.fr', createdAt: '',
    }));

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/projects').flush(PROJETS);
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('affiche les trois entrees de menu', () => {
    const liens: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('nav.nav .nav-item'));
    const libelles = liens.map((l) => l.textContent!.trim());
    expect(libelles).toContain('Tableau de bord');
    expect(libelles).toContain('Projets');
    expect(libelles).toContain('Mon profil');
  });

  it('liste les projets recents', () => {
    expect(fixture.nativeElement.textContent).toContain('Refonte du site');
    expect(fixture.nativeElement.textContent).toContain('Migration MySQL');
  });

  it('affiche les initiales de l utilisateur', () => {
    expect(fixture.nativeElement.querySelector('.account .avatar').textContent.trim()).toBe('AD');
  });

  it('bascule en mode reduit et memorise l etat', () => {
    expect(fixture.componentInstance.collapsed()).toBeFalse();

    fixture.componentInstance.toggle();
    fixture.detectChanges();

    expect(fixture.componentInstance.collapsed()).toBeTrue();
    expect(localStorage.getItem('pmt.sidebarCollapsed')).toBe('1');
    expect(fixture.nativeElement.querySelector('.sidebar.collapsed')).not.toBeNull();
  });

  it('donne une couleur de pastille differente selon le role', () => {
    const c = fixture.componentInstance;
    expect(c.dotColor('ADMIN')).not.toBe(c.dotColor('MEMBER'));
    expect(c.dotColor('OBSERVER')).not.toBe(c.dotColor('ADMIN'));
  });
});
