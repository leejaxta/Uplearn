import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from './components/landing/landing.component';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { CoursesComponent } from './components/courses/courses.component';
import { FormsModule } from '@angular/forms';
import { CourseInfoComponent } from './components/course-info/course-info.component';
import { AboutComponent } from './components/about/about.component';

@NgModule({
  declarations: [LandingComponent, CoursesComponent, CourseInfoComponent, AboutComponent],
  imports: [CommonModule, HomeRoutingModule, SharedModule, FormsModule],
})
export class HomeModule {}
