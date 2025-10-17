import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import html2pdf from 'html2pdf.js';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.scss',
})
export class CertificateComponent {
  public enrolled_id!: number;
  public course_id!: number;
  public studentName: string = '';
  public courseName: string = '';
  public instructorName: string = '';

  today: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private enrollmentService: EnrollmentService,
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {
    this.enrolled_id = Number(this.route.snapshot.paramMap.get('eid'));
    this.studentName = this.authService.getCurrentUser()?.displayName!;
    this.enrollmentService
      .getEnrollmentById(this.enrolled_id)
      .subscribe((val) => {
        this.course_id = val.course_id;

        this.courseService.getCourseById(this.course_id).subscribe((val) => {
          this.courseName = val.title;
          this.instructorName = val.instructorName;
        });
      });
  }

  public downloadCertificate(element: HTMLElement): void {
    const options = {
      margin: 0,
      filename: `${this.studentName}-certificate.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          const styles = document.querySelectorAll(
            'style, link[rel="stylesheet"]'
          );
          styles.forEach((style) =>
            clonedDoc.head.appendChild(style.cloneNode(true))
          );
        },
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' },
    };

    (html2pdf as any)().from(element).set(options).save();

    this.router.navigate([`/student/enrolled/${this.enrolled_id}`]);
  }
}
