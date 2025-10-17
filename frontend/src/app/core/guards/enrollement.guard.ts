import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EnrollmentService } from '../services/enrollment.service';

export const enrollmentGuard: CanActivateFn = (route, state) => {
  const enrollmentService: EnrollmentService = inject(EnrollmentService);
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  const eid: number = Number(route.paramMap.get('eid'));
  const userId: string | undefined = authService.getCurrentUser()?.uid;

  if (!eid || !userId) {
    router.navigate(['/unauthorized']);
    return of(false);
  }

  return enrollmentService.getEnrollmentById(eid).pipe(
    switchMap((enrollment) =>
      enrollmentService.isEnrolled(userId, enrollment.course_id).pipe(
        map((res) => {
          if (res.length > 0) {
            return true;
          }
          router.navigate(['/unauthorized']);
          return false;
        })
      )
    ),
    catchError(() => {
      router.navigate(['/unauthorized']);
      return of(false);
    })
  );
};
