import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); localStorage.clear(); });

  function remplir() {
    const c = fixture.componentInstance;
    c.firstName = 'Yann'; c.lastName = 'Dipita';
    c.email = 'yann@pmt.fr'; c.password = 'motdepasse123';
    return c;
  }

  it('enchaine sur une vraie connexion apres inscription', () => {
    remplir().submit();

    http.expectOne('/api/auth/register').flush({
      id: '1', firstName: 'Yann', lastName: 'Dipita', email: 'yann@pmt.fr', createdAt: '',
    });
    http.expectOne('/api/auth/login').flush({
      accessToken: 'jeton', tokenType: 'Bearer', expiresInSeconds: 3600,
      user: { id: '1', firstName: 'Yann', lastName: 'Dipita', email: 'yann@pmt.fr', createdAt: '' },
    });

    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('detaille les erreurs de validation champ par champ', () => {
    const c = remplir();
    c.submit();

    http.expectOne('/api/auth/register').flush(
      { message: 'Requete invalide', fields: { email: "Format d'email invalide" } },
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();

    expect(c.error()).toBe('Requete invalide');
    expect(c.fieldErrors()!['email']).toContain('email');
    expect(fixture.nativeElement.querySelector('.error-list').textContent).toContain('email');
  });

  it('signale un email deja pris', () => {
    const c = remplir();
    c.submit();

    http.expectOne('/api/auth/register').flush(
      { message: 'Cet email est deja utilise : yann@pmt.fr' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(c.error()).toContain('deja utilise');
  });
});
