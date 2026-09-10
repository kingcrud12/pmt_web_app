import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Empêche d'afficher une page privée sans session.
 *
 * C'est du CONFORT D'AFFICHAGE, jamais une mesure de sécurité : un garde
 * Angular s'obtient en une ligne dans la console du navigateur. La seule
 * protection réelle est celle du serveur, qui revalide chaque requête.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
