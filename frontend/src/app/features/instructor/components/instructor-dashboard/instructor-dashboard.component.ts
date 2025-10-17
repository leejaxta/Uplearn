import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Course } from '../../../../core/models/course.model';
import { Router } from '@angular/router';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.scss',
})
export class InstructorDashboardComponent implements OnInit {
  public courses: Course[] = [];
  public showForm: boolean = false;
  public editingCourseId: number | null = null;
  public showDeleteModal: boolean = false;
  public courseToDelete: number | null = null;
  public confirmText: string = '';

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadInstructorCourses();
  }

  public loadInstructorCourses(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.courseService.getInstructorCourses(currentUser.uid).subscribe({
      next: (courses) => {
        this.courses = courses;
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        alert('Failed to load your courses.');
      },
    });
  }

  public openCreateForm(): void {
    this.editingCourseId = null;
    this.showForm = true;
  }

  public openEditForm(courseId: number): void {
    this.editingCourseId = courseId;
    this.showForm = true;
  }

  public onFormSavedOrCanceled(): void {
    this.showForm = false;
    this.editingCourseId = null;
    this.loadInstructorCourses();
  }

  public openDeleteModal(courseId: number): void {
    this.courseToDelete = courseId;
    this.confirmText = '';
    this.showDeleteModal = true;
  }

  public closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.courseToDelete = null;
    this.confirmText = '';
  }

  public onConfirmInput(value: string): void {
    this.confirmText = value;
  }

  public confirmDelete(): void {
    if (this.confirmText.trim().toUpperCase() !== 'CONFIRM') {
      this.toaster.showError('Please type "CONFIRM" to delete this course.');
      return;
    }

    if (!this.courseToDelete) return;

    this.courseService.deleteCourse(this.courseToDelete).subscribe({
      next: () => {
        this.toaster.showSuccess('Course deleted successfully!');
        this.closeDeleteModal();
        this.loadInstructorCourses();
      },
      error: (err) => {
        this.toaster.showError('Failed to delete course. Please try again.');
      },
    });
  }

  public goToCourseOverview(id: number): void {
    this.router.navigate([`/instructor/course-overview/${id}`]);
  }
}
