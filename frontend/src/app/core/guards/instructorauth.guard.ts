import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const instructorauthGuard: CanActivateFn = (route, state) => {
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
      if (!user.isInstructor) {
        router.navigate(['/error']);
        return false;
      }
      return true;
    })
  );
};
