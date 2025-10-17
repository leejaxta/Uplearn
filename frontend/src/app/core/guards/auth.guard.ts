import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.user$.pipe(
    map((user) => {
      if (!user) {
        router.navigate(['/auth/login'], {
          queryParams: { redirect: state.url },
        });
        return false;
      }
      return true;
    })
  );
};
