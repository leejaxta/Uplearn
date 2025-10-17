import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { studentauthGuard } from '../../core/guards/studentauth.guard';
import { EnrolledCourseComponent } from './components/enrolled-course/enrolled-course.component';
import { enrollmentGuard } from '../../core/guards/enrollement.guard';
import { QuizComponent } from './components/quiz/quiz.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentFailureComponent } from './components/payment-failure/payment-failure.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: StudentDashboardComponent,
  },
  {
    path: 'enrolled/:eid',
    component: EnrolledCourseComponent,
    canActivate: [enrollmentGuard],
  },
  {
    path: 'payment-success',
    component: PaymentSuccessComponent,
  },
  {
    path: 'payment-failure',
    component: PaymentFailureComponent,
  },
  {
    path: 'certificate/:eid',
    component: CertificateComponent,
    canActivate: [enrollmentGuard],
  },
  {
    path: 'quiz/:type/:id',
    component: QuizComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentRoutingModule {}
