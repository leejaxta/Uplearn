import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstructorDashboardComponent } from './components/instructor-dashboard/instructor-dashboard.component';
import { InstructorRoutingModule } from './instructor-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { CourseFormComponent } from './components/course-form/course-form.component';
import { InstructorOverviewComponent } from './components/instructor-overview/instructor-overview.component';
import { InstructorCourseOverviewComponent } from './components/instructor-course-overview/instructor-course-overview.component';

@NgModule({
  declarations: [
    InstructorDashboardComponent,
    CourseFormComponent,
    InstructorOverviewComponent,
    InstructorCourseOverviewComponent,
  ],
  imports: [
    CommonModule,
    InstructorRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
  ],
})
export class InstructorModule {}
