import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { StudentRoutingModule } from './student-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { EnrolledCourseComponent } from './components/enrolled-course/enrolled-course.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { CertificateComponent } from './components/certificate/certificate.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentFailureComponent } from './components/payment-failure/payment-failure.component';

@NgModule({
  declarations: [StudentDashboardComponent, EnrolledCourseComponent, QuizComponent, CertificateComponent, PaymentSuccessComponent, PaymentFailureComponent],
  imports: [CommonModule, StudentRoutingModule, SharedModule],
})
export class StudentModule {}
