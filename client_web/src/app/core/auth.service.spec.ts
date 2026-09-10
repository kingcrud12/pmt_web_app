import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginResponse, UserResponse } from './models';

const USER: UserResponse = {
  id: 'f96471dc-c69d-43d7-b209-ed0bcbcc2f9e',
  firstName: 'Alice',
  lastName: 'Durand',
  email: 'alice@pmt.fr',
  createdAt: '2026-09-10T08:00:00Z',
};

const LOGIN: LoginResponse = {
  accessToken: 'jeton-de-test',
  tokenType: 'Bearer',
  expiresInSeconds: 3600,
  user: USER,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('demarre deconnecte', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.token).toBeNull();
  });

  it('poste les identifiants sur /api/auth/login', () => {
    service.login('alice@pmt.fr', 'motdepasse123').subscribe();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'alice@pmt.fr', password: 'motdepasse123' });
    req.flush(LOGIN);
  });

  it('conserve le jeton et l utilisateur apres connexion', () => {
    service.login('alice@pmt.fr', 'motdepasse123').subscribe();
    http.expectOne('/api/auth/login').flush(LOGIN);

    expect(service.token).toBe('jeton-de-test');
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.user()?.email).toBe('alice@pmt.fr');
  });

  it('efface tout et renvoie vers la connexion au logout', () => {
    service.login('alice@pmt.fr', 'motdepasse123').subscribe();
    http.expectOne('/api/auth/login').flush(LOGIN);

    service.logout();

    expect(service.token).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('poste l inscription sans jamais renvoyer de mot de passe', () => {
    service.register('Yann', 'Dipita', 'yann@pmt.fr', 'motdepasse123').subscribe((u) => {
      expect(u.email).toBe('alice@pmt.fr');
      expect((u as unknown as Record<string, unknown>)['password']).toBeUndefined();
    });

    const req = http.expectOne('/api/auth/register');
    expect(req.request.body).toEqual({
      firstName: 'Yann', lastName: 'Dipita', email: 'yann@pmt.fr', password: 'motdepasse123',
    });
    req.flush(USER);
  });
});
