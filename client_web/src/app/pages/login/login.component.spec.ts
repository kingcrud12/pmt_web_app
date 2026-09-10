import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  it('affiche le panneau de marque et le formulaire', () => {
    const texte = fixture.nativeElement.textContent;
    expect(texte).toContain('Connexion');
    expect(fixture.nativeElement.querySelector('#email')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#password')).not.toBeNull();
  });

  it('renvoie vers les projets apres une connexion reussie', () => {
    const c = fixture.componentInstance;
    c.email = 'alice@pmt.fr';
    c.password = 'motdepasse123';
    c.submit();

    http.expectOne('/api/auth/login').flush({
      accessToken: 'jeton', tokenType: 'Bearer', expiresInSeconds: 3600,
      user: { id: '1', firstName: 'Alice', lastName: 'Durand', email: 'alice@pmt.fr', createdAt: '' },
    });

    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('affiche le message du serveur en cas d echec', () => {
    const c = fixture.componentInstance;
    c.email = 'alice@pmt.fr';
    c.password = 'faux';
    c.submit();

    http.expectOne('/api/auth/login').flush(
      { message: 'Identifiants invalides' },
      { status: 401, statusText: 'Unauthorized' }
    );
    fixture.detectChanges();

    expect(c.error()).toBe('Identifiants invalides');
    expect(c.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.error').textContent).toContain('Identifiants invalides');
  });
});
