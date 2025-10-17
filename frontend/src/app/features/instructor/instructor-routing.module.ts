import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { instructorauthGuard } from '../../core/guards/instructorauth.guard';
import { InstructorDashboardComponent } from './components/instructor-dashboard/instructor-dashboard.component';
import { InstructorOverviewComponent } from './components/instructor-overview/instructor-overview.component';
import { InstructorCourseOverviewComponent } from './components/instructor-course-overview/instructor-course-overview.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: InstructorDashboardComponent,
    canActivate: [instructorauthGuard],
  },
  {
    path: 'overview',
    component: InstructorOverviewComponent,
  },
  {
    path: 'course-overview/:id',
    component: InstructorCourseOverviewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InstructorRoutingModule {}
