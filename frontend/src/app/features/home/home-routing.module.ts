import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { CoursesComponent } from './components/courses/courses.component';
import { CourseInfoComponent } from './components/course-info/course-info.component';
import { AboutComponent } from './components/about/about.component';
import { instructorBlockGuard } from '../../core/guards/instructor-block.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'homepage',
    pathMatch: 'full',
  },
  {
    path: 'homepage',
    component: LandingComponent,
  },
  {
    path: 'aboutUs',
    component: AboutComponent,
  },
  {
    path: 'courses',
    component: CoursesComponent,
    canActivate: [instructorBlockGuard],
  },
  {
    path: 'course/:id',
    component: CourseInfoComponent,
    canActivate: [instructorBlockGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
