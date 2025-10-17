import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const studentauthGuard: CanActivateFn = (route, state) => {
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
      if (user.isInstructor) {
        router.navigate(['/error']);
        return false;
      }
      return true;
    })
  );
};
