import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  Course,
  CourseResponse,
  DeleteCourseResponse,
  FormCourseResponse,
  TopicResponse,
  UpdateCourseResponse,
} from '../models/course.model';
import { environment } from '../../../environments/environment';
import { EnrollmentResponse } from '../models/enrollment.model';
import { StudentCourseProgress } from '../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(private http: HttpClient) {}

  public createCourse(formData: FormData): Observable<Course> {
    return this.http.post<Course>(`${environment.baseUrl}/courses`, formData);
  }

  public getAllCourses(): Observable<Course[]> {
    return this.http
      .get<Course[]>(`${environment.baseUrl}/courses`)
      .pipe(map((courses) => courses.map(({ finalQuiz, ...rest }) => rest)));
  }

  public getCourseById(id: number): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(
      `${environment.baseUrl}/courses/${id}`
    );
  }

  public getTopicById(id: number): Observable<TopicResponse> {
    return this.http.get<TopicResponse>(`${environment.baseUrl}/topics/${id}`);
  }

  public getTopicsByIds(ids: number[]): Observable<TopicResponse[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const query = ids.map((id) => `id=${id}`).join('&');
    return this.http.get<TopicResponse[]>(
      `${environment.baseUrl}/topics?${query}`
    );
  }

  public getNumberOfDocuments(courseId: number): Observable<number> {
    return this.getCourseById(courseId).pipe(
      switchMap((course) => {
        if (!course.topics || course.topics.length === 0) {
          return of(0);
        }

        const topicObservables = course.topics.map((topicId) =>
          this.getTopicById(topicId)
        );

        return forkJoin(topicObservables).pipe(
          map((topics) => {
            return topics.reduce((total, topic) => {
              return total + (topic.files ? topic.files.length : 0);
            }, 0);
          })
        );
      })
    );
  }

  public getCourseWithTopicsByEnrollment(
    eid: number
  ): Observable<{ course: CourseResponse; topics: TopicResponse[] }> {
    return this.http
      .get<EnrollmentResponse>(`${environment.baseUrl}/enrollments/${eid}`)
      .pipe(
        switchMap((enrollment) =>
          this.getCourseById(enrollment.course_id).pipe(
            switchMap((course) =>
              this.getTopicsByIds(course.topics).pipe(
                map((topics) => ({ course, topics }))
              )
            )
          )
        )
      );
  }

  public getInstructorCourses(instructorId: string): Observable<Course[]> {
    return this.http.get<Course[]>(
      `${environment.baseUrl}/courses/instructor/${instructorId}`
    );
  }

  public getCourseWithTopics(id: number): Observable<FormCourseResponse> {
    return this.getCourseById(id).pipe(
      switchMap((course: CourseResponse) => {
        const topicRequests = course.topics.map((topicId: number) =>
          this.getTopicById(topicId)
        );

        return forkJoin(topicRequests).pipe(
          map((topics) => ({
            ...course,
            topics,
          }))
        );
      })
    );
  }

  public getStudentCourses(id: string): Observable<StudentCourseProgress[]> {
    return this.http.get<StudentCourseProgress[]>(
      `${environment.baseUrl}/students/courses/progress/${id}`
    );
  }

  public updateCourse(
    id: number,
    formData: FormData
  ): Observable<UpdateCourseResponse> {
    return this.http.put<UpdateCourseResponse>(
      `${environment.baseUrl}/courses/${id}`,
      formData
    );
  }

  public deleteCourse(id: number): Observable<DeleteCourseResponse> {
    return this.http.delete<DeleteCourseResponse>(
      `${environment.baseUrl}/courses/${id}`
    );
  }
}
