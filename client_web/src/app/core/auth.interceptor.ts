import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Attache le jeton à chaque requête sortante et déconnecte sur 401.
 *
 * C'est ce geste explicite — ajouter un en-tête — qui rend le CSRF impossible :
 * un site tiers peut forcer le navigateur à envoyer un cookie, jamais à
 * ajouter un en-tête Authorization.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  const authorised = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorised).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = jeton absent, invalide ou expiré : on repart proprement.
      if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
