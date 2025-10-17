import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Enrollment_Final_Quiz,
  Enrollment_Topic_Progress,
  EnrollmentResponse,
} from '../models/enrollment.model';
import {
  CourseChart,
  InstructorAnalyticsResponse,
} from '../models/instructor.model';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  constructor(private http: HttpClient) {}

  public addEnrollment(
    studentId: string,
    courseId: number
  ): Observable<EnrollmentResponse> {
    const enrollment = {
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    };

    return this.http.post<EnrollmentResponse>(
      `${environment.baseUrl}/enrollments`,
      enrollment
    );
  }

  public addPayment(
    studentId: string,
    courseId: number
  ): Observable<PaymentResponse> {
    const enrollment = {
      student_id: studentId,
      course_id: courseId,
      payment_at: new Date().toISOString(),
      status: 'completed',
    };

    return this.http.post<PaymentResponse>(
      `${environment.baseUrl}/payments`,
      enrollment
    );
  }

  public isEnrolled(
    studentId: string,
    courseId: number
  ): Observable<EnrollmentResponse[]> {
    const url = `${environment.baseUrl}/enrollments?student_id=${studentId}&course_id=${courseId}`;
    return this.http.get<EnrollmentResponse[]>(url);
  }

  public getEnrollmentById(eid: number): Observable<EnrollmentResponse> {
    return this.http.get<EnrollmentResponse>(
      `${environment.baseUrl}/enrollments/${eid}`
    );
  }

  public addEnrollementTopicProgress(
    enrolledId: number,
    topicId: number
  ): Observable<Enrollment_Topic_Progress> {
    const enrollment_topic_progress = {
      enrollment_id: enrolledId,
      topic_id: topicId,
      completed_at: new Date().toISOString(),
    };

    return this.http.post<Enrollment_Topic_Progress>(
      `${environment.baseUrl}/enrollment_topic_progress`,
      enrollment_topic_progress
    );
  }

  public getEnrollementTopicProgress(
    enrolledId: number,
    topicId: number
  ): Observable<Enrollment_Topic_Progress[]> {
    const url = `${environment.baseUrl}/enrollment_topic_progress?topic_id=${topicId}&enrollment_id=${enrolledId}`;
    return this.http.get<Enrollment_Topic_Progress[]>(url);
  }

  public addEnrollementFinalQuiz(
    enrolledId: number
  ): Observable<Enrollment_Final_Quiz> {
    const enrollment_final_quiz = {
      enrollment_id: enrolledId,
      completed_at: new Date().toISOString(),
    };

    return this.http.post<Enrollment_Final_Quiz>(
      `${environment.baseUrl}/enrollment_final_quiz`,
      enrollment_final_quiz
    );
  }

  public getEnrollementFinalQuiz(
    enrolledId: number
  ): Observable<Enrollment_Final_Quiz[]> {
    const url = `${environment.baseUrl}/enrollment_final_quiz?enrollment_id=${enrolledId}`;
    return this.http.get<Enrollment_Final_Quiz[]>(url);
  }

  public getInstructorOverview(
    instructorId: string
  ): Observable<InstructorAnalyticsResponse> {
    return this.http.get<InstructorAnalyticsResponse>(
      `${environment.baseUrl}/instructors/analytics/${instructorId}`
    );
  }

  public getCourseOverview(courseId: number): Observable<CourseChart> {
    return this.http.get<CourseChart>(
      `${environment.baseUrl}/courses/analytics/${courseId}`
    );
  }
}
