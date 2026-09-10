import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => { ctrl.verify(); localStorage.clear(); });

  it('n ajoute aucun en-tete quand il n y a pas de jeton', () => {
    http.get('/api/projects').subscribe();
    const req = ctrl.expectOne('/api/projects');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('attache le jeton dans l en-tete Authorization', () => {
    localStorage.setItem('pmt.accessToken', 'jeton-de-test');

    http.get('/api/projects').subscribe();
    const req = ctrl.expectOne('/api/projects');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jeton-de-test');
    req.flush([]);
  });

  it('deconnecte sur une reponse 401', () => {
    localStorage.setItem('pmt.accessToken', 'jeton-expire');
    spyOn(auth, 'logout');

    http.get('/api/projects').subscribe({ error: () => {} });
    ctrl.expectOne('/api/projects').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
  });

  it('ne deconnecte pas quand c est la connexion elle-meme qui echoue', () => {
    spyOn(auth, 'logout');

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    ctrl.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
  });
});
