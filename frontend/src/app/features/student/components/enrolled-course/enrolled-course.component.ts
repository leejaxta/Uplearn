import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import {
  CourseResponse,
  TopicResponse,
} from '../../../../core/models/course.model';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-enrolled-course',
  templateUrl: './enrolled-course.component.html',
  styleUrl: './enrolled-course.component.scss',
})
export class EnrolledCourseComponent implements OnInit {
  public course!: CourseResponse;
  public topics: TopicResponse[] = [];
  public currentTopic: TopicResponse | null = null;
  public enrolled_id!: number;
  public loading: boolean = true;
  public topicCompleted: boolean = false;
  public courseCompleted: boolean = false;
  public currentTopicIndex: number = 0;
  public allTopicsCompleted: boolean = false;
  public videoUrl: string = '';
  private currentRestoreListener: (() => void) | null = null;

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private router: Router,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    this.enrolled_id = Number(this.route.snapshot.paramMap.get('eid'));
    this.courseService
      .getCourseWithTopicsByEnrollment(this.enrolled_id)
      .subscribe({
        next: ({ course, topics }) => {
          this.course = course;
          this.topics = topics;

          if (this.topics.length > 0) {
            this.currentTopic = this.topics[0];
            this.topicProgress();
            this.selectTopic(0);
            this.courseCompletions();
            this.checkAllTopicsCompleted();
          }

          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private get storageKey(): string {
    if (!this.course || !this.currentTopic) return 'videoProgress_unknown';
    return `video_${this.course.id}_${this.currentTopic.id}`;
  }

  public onTimeUpdate(): void {
    const videoEl = this.videoPlayer.nativeElement;
    if (!videoEl || !this.currentTopic) return;

    const currentTime = videoEl.currentTime;
    localStorage.setItem(this.storageKey, currentTime.toString());
  }

  private restoreVideoProgress(): void {
    const videoEl = this.videoPlayer.nativeElement;
    if (!videoEl || !this.currentTopic) return;

    if (this.currentRestoreListener) {
      videoEl.removeEventListener(
        'loadedmetadata',
        this.currentRestoreListener
      );
      this.currentRestoreListener = null;
    }

    const savedTime = localStorage.getItem(this.storageKey);
    if (!savedTime) return;

    const setTime = () => {
      videoEl.currentTime = parseFloat(savedTime);
    };

    if (videoEl.readyState >= 1) {
      setTime();
    } else {
      this.currentRestoreListener = setTime;
      videoEl.addEventListener('loadedmetadata', setTime, { once: true });
    }
  }

  public topicProgress(): void {
    if (!this.currentTopic) return;

    this.enrollmentService
      .getEnrollementTopicProgress(this.enrolled_id, this.currentTopic.id!)
      .subscribe((progressList) => {
        this.topicCompleted = progressList && progressList.length > 0;
      });
  }

  public courseCompletions(): void {
    this.enrollmentService
      .getEnrollementFinalQuiz(this.enrolled_id)
      .subscribe((completionList) => {
        this.courseCompleted = completionList && completionList.length > 0;
      });
  }

  public selectTopic(index: number): void {
    this.currentTopicIndex = index;
    this.currentTopic = this.topics[index];
    this.topicProgress();
    this.videoUrl = this.currentTopic.video!;
    setTimeout(() => this.restoreVideoProgress(), 0);
  }

  public getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'PowerPoint Presentation';

      default:
        return 'File';
    }
  }

  public getFileSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
    const readableSize = (sizeInBytes / Math.pow(k, i)).toFixed(1);

    return `${readableSize} ${sizes[i]}`;
  }

  public checkAllTopicsCompleted(): void {
    if (!this.topics || this.topics.length === 0) {
      this.allTopicsCompleted = false;
      return;
    }

    const progressObservables = this.topics.map((topic) =>
      this.enrollmentService.getEnrollementTopicProgress(
        this.enrolled_id,
        topic.id!
      )
    );

    forkJoin(progressObservables).subscribe((results) => {
      this.allTopicsCompleted = results.every(
        (progressList) => progressList.length > 0
      );
    });
  }

  public openQuiz(topic: TopicResponse): void {
    this.router.navigate([`/student/quiz/topic/${topic.id}`], {
      queryParams: { redirect: this.router.url },
    });
  }

  public openFinalQuiz(courseId: number): void {
    this.router.navigate([`/student/quiz/final/${courseId}`], {
      queryParams: { redirect: this.router.url },
    });
  }

  public getCertificate(): void {
    this.router.navigate([`/student/certificate/${this.enrolled_id}`]);
  }
}
