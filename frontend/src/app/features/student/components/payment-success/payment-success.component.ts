import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.scss',
})
export class PaymentSuccessComponent implements OnInit {
  public courseId!: number;
  public studentId!: string | undefined;
  public enrolledId!: number;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private enrollmentService: EnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.courseId = Number(params.get('courseId'));
    });
    this.studentId = this.authService.getCurrentUser()?.uid;
    const status = localStorage.getItem('PaymentStatus');

    if (status) {
      window.history.replaceState(null, '', window.location.href);
      this.enrollmentService
        .addPayment(this.studentId!, this.courseId)
        .subscribe((val) => {
          this.enrollmentService
            .addEnrollment(this.studentId!, this.courseId)
            .subscribe((val) => {
              this.enrolledId = val.id;
            });
        });
      setTimeout(() => {
        this.goToCourse();
      }, 3000);

      localStorage.removeItem('PaymentStatus');
    } else {
      this.router.navigate(['']);
    }
  }

  public goToCourse(): void {
    this.router.navigate([`/student/enrolled/${this.enrolledId}`]);
  }

  public goToCourses(): void {
    this.router.navigate(['/home/courses']);
  }
}
