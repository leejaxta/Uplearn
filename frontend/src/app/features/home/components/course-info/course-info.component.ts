import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import {
  CourseResponse,
  TopicResponse,
} from '../../../../core/models/course.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AppUser } from '../../../../core/models/user.model';
import { generateEsewaSignature } from '../../../../core/utils/utils';
import { signal } from '@angular/core';

@Component({
  selector: 'app-course-info',
  templateUrl: './course-info.component.html',
  styleUrl: './course-info.component.scss',
})
export class CourseInfoComponent implements OnInit {
  public isEnrolled!: boolean;
  public enrolledId!: number;
  public course!: CourseResponse;
  public topics: TopicResponse[] = [];
  public loading: boolean = true;
  public courseUrl!: string;
  public showToast = signal(false);
  public numberOfDocuments: number = 0;
  public serviceChargeRate: number = 0.1;
  public courseEnrollment!: number;
  public totalEnrollment!: number;
  public totalCourses!: number;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private router: Router,
    private authService: AuthService,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    this.courseUrl = window.location.origin + this.router.url;

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.courseService
      .getNumberOfDocuments(id)
      .subscribe((val) => (this.numberOfDocuments = val));

    this.loadCourse(id);
  }

  get user(): AppUser | null {
    return this.authService.getCurrentUser();
  }

  get serviceCharge(): number {
    return this.course.price * this.serviceChargeRate;
  }

  public loadCourse(id: number): void {
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.course = course;
        this.loadTopics(course.topics || []);
        this.checkEnrolled();

        this.enrollmentService
          .getCourseOverview(course.id!)
          .subscribe((res) => {
            this.courseEnrollment = res.totalEnrollments;
          });

        this.enrollmentService
          .getInstructorOverview(course.instructorId)
          .subscribe((res) => {
            this.totalCourses = res.totalCourses;
            this.totalEnrollment = res.totalEnrollments;
          });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching course:', err);
        this.loading = false;
      },
    });
  }

  public checkEnrolled(): void {
    if (this.user && this.course.id) {
      this.enrollmentService
        .isEnrolled(this.user.uid, this.course.id)
        .subscribe((res) => {
          if (res.length > 0) {
            this.enrolledId = res[0].id;
            this.isEnrolled = true;
          } else {
            this.isEnrolled = false;
          }
        });
    }
  }

  public navigateToCourse(): void {
    this.router.navigate([`/student/enrolled/${this.enrolledId}`]);
  }

  public loadTopics(topicIds: number[]): void {
    if (!topicIds || topicIds.length === 0) {
      this.topics = [];

      return;
    }

    this.courseService.getTopicsByIds(topicIds).subscribe((topics) => {
      this.topics = topics;
    });
  }

  public copyCourseLink(): void {
    navigator.clipboard.writeText(this.courseUrl).then(() => {
      this.showToast.set(true);

      setTimeout(() => {
        this.showToast.set(false);
      }, 3000);
    });
  }

  public enroll(): void {
    if (!this.user?.uid) {
      this.router.navigate(['/auth/login'], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    if (!this.course?.id) {
      console.error('Course ID is missing!');
      return;
    }

    if (this.course.price === 0) {
      this.enrollFreeCourse();
    } else {
      this.redirectToEsewa();
    }
  }

  private enrollFreeCourse(): void {
    this.enrollmentService
      .addEnrollment(this.user?.uid!, this.course.id!)
      .subscribe({
        next: (res) => {
          this.router.navigate([`/student/enrolled/${res.id}`]);
          this.isEnrolled = true;
        },
        error: (err) => {
          console.error('Failed to enroll:', err);
        },
      });
  }

  public redirectToEsewa(): void {
    const transactionUUID = `COURSE_${this.course.id}_${Date.now()}`;
    const totalAmount = this.course.price;
    const signature = generateEsewaSignature(
      totalAmount,
      transactionUUID,
      'EPAYTEST'
    );

    localStorage.setItem('PaymentStatus', 'true');

    const params = {
      amount: this.course.price.toString(),
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUUID,
      product_code: 'EPAYTEST',
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${window.location.origin}/student/payment-success?courseId=${this.course.id}&userId=${this.user?.uid}`,
      failure_url: `${window.location.origin}/student/payment-failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature,
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    for (const key in params) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(params[key as keyof typeof params]);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
}
