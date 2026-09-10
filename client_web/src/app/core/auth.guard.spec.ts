import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  function run(url: string) {
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard({} as never, state));
  }

  it('laisse passer un utilisateur connecte', () => {
    localStorage.setItem('pmt.user', JSON.stringify({
      id: '1', firstName: 'Alice', lastName: 'Durand', email: 'a@b.fr', createdAt: '',
    }));
    TestBed.inject(AuthService);
    expect(run('/projects')).toBeTrue();
  });

  it('renvoie vers la connexion en gardant la destination', () => {
    const result = run('/projects/42');
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('redirect');
  });
});
