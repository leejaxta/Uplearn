import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { StudentCourseProgress } from '../../../../core/models/student.model';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent implements OnInit {
  public studentId: string | undefined;
  public enrolledCourses: StudentCourseProgress[] = [];
  public isLoading: boolean = true;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.studentId = this.authService.getCurrentUser()?.uid;

    if (this.studentId) {
      this.courseService.getStudentCourses(this.studentId).subscribe({
        next: (courses) => {
          this.enrolledCourses = courses.filter(
            (c: StudentCourseProgress) => c.courseTitle && c.courseImage
          );
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load courses', err);
          this.isLoading = false;
        },
      });
    }
  }

  public goToCourse(enrollmentId: number): void {
    this.router.navigate(['/student/enrolled', enrollmentId]);
  }
}
