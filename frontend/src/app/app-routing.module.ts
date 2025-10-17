import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { studentauthGuard } from './core/guards/studentauth.guard';
import { authReverseGuard } from './core/guards/auth-reverse.guard';
import { instructorauthGuard } from './core/guards/instructorauth.guard';
import { SelectivePreloadingStrategy } from './core/strategies/selective-preloading.strategy';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'home',
    loadChildren: () =>
      import('./features/home/home.module').then((m) => m.HomeModule),
    data: { preload: true },
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
    canActivate: [authReverseGuard],
    data: { preload: false },
  },

  {
    path: 'student',
    loadChildren: () =>
      import('./features/student/student.module').then((m) => m.StudentModule),
    canActivate: [studentauthGuard],
    data: { preload: false },
  },

  {
    path: 'instructor',
    loadChildren: () =>
      import('./features/instructor/instructor.module').then(
        (m) => m.InstructorModule
      ),
    canActivate: [instructorauthGuard],
    data: { preload: false },
  },

  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: SelectivePreloadingStrategy,
    }),
  ],
  exports: [RouterModule],
  providers: [SelectivePreloadingStrategy],
})
export class AppRoutingModule {}
