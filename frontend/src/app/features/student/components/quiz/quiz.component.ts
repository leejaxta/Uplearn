import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../../core/services/course.service';
import { Question, TopicResponse } from '../../../../core/models/course.model';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AppUser } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  public topic!: TopicResponse;
  public quiz!: Question[];

  public quizStarted: boolean = false;
  public showCountdown: boolean = false;
  public timeExpired: boolean = false;
  public allCorrect!: boolean | undefined;
  public quizCompleted: boolean = false;
  public startModalVisible: boolean = false;
  public timeExpiredModalVisible: boolean = false;
  public quizCompletedModalVisible: boolean = false;

  public countdownValue: number = 3;
  public remainingTime: number = 0;
  public currentQuestionIndex: number = 0;
  public course_id!: number;
  public enrollment_id!: number;

  public type: string | null = null;
  public redirectUrl: string | null = null;
  public quizResultMessage: string = '';
  public userAnswers: string[] = [];

  public countdownInterval!: ReturnType<typeof setInterval>;
  public timerInterval!: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private router: Router,
    private enrollmentService: EnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
    this.type = this.route.snapshot.paramMap.get('type');
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (this.type === 'topic') {
      this.courseService.getTopicById(id).subscribe((val) => {
        this.topic = val;
        this.quiz = val.quiz?.questions!;
        this.course_id = val.courseId;
        this.initializeQuiz();

        setTimeout(() => {
          this.startModalVisible = true;
        }, 100);

        this.getEnrollmentId();
      });
    } else if (this.type === 'final') {
      this.courseService.getCourseById(id).subscribe((val) => {
        this.quiz = val.finalQuiz?.questions!;
        this.course_id = val.id!;
        this.initializeQuiz();

        setTimeout(() => {
          this.startModalVisible = true;
        }, 100);

        this.getEnrollmentId();
      });
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  public getEnrollmentId(): void {
    if (this.user?.uid) {
      this.enrollmentService
        .isEnrolled(this.user.uid, this.course_id)
        .subscribe((enrollment) => {
          if (enrollment && enrollment.length > 0) {
            this.enrollment_id = enrollment[0].id;
          }
        });
    }
  }

  get user(): AppUser | null {
    return this.authService.getCurrentUser();
  }

  get progress(): number {
    const total = this.quiz.length;

    if (this.quizCompleted) {
      return 100;
    }

    return (this.currentQuestionIndex / total!) * 100;
  }

  public initializeQuiz(): void {
    this.userAnswers = new Array(this.quiz?.length || 0).fill('');
  }

  public calculateTimeLimit(): number {
    const questionCount = this.quiz?.length || 0;
    return questionCount * 0.2;
  }

  public startQuiz(): void {
    this.startModalVisible = false;

    this.showCountdown = true;
    this.countdownValue = 3;

    this.countdownInterval = setInterval(() => {
      this.countdownValue--;

      if (this.countdownValue < 0) {
        clearInterval(this.countdownInterval);
        this.showCountdown = false;
        this.startQuizTimer();
        this.quizStarted = true;
      }
    }, 1000);
  }

  public startQuizTimer(): void {
    const timeLimit = this.calculateTimeLimit() * 60;
    this.remainingTime = timeLimit;

    this.timerInterval = setInterval(() => {
      this.remainingTime--;

      if (this.remainingTime <= 0) {
        this.timeExpired = true;
        this.clearTimers();

        setTimeout(() => {
          this.timeExpiredModalVisible = true;
        }, 500);
      }
    }, 1000);
  }

  public clearTimers(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  get currentQuestion(): Question | undefined {
    return this.quiz?.[this.currentQuestionIndex];
  }

  public getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  public selectAnswer(answer: string): void {
    this.userAnswers[this.currentQuestionIndex] = answer;
  }

  public previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  public nextQuestion(): void {
    if (this.currentQuestionIndex < (this.quiz?.length || 0) - 1) {
      this.currentQuestionIndex++;
    }
  }

  public submitQuiz(): void {
    this.quizCompleted = true;

    this.clearTimers();
    this.checkAnswers();
  }

  public onModalClose(show: boolean): void {
    if (!show) {
      this.router.navigateByUrl(this.redirectUrl || '/');
    }
  }

  public checkAnswers(): void {
    this.allCorrect = this.quiz?.every((question, index) => {
      return this.userAnswers[index] === question.answer;
    });

    if (this.allCorrect) {
      this.quizResultMessage = 'Congratulations! All answers are correct ';
      if (this.type === 'topic' && this.enrollment_id) {
        this.enrollmentService
          .addEnrollementTopicProgress(this.enrollment_id, this.topic.id!)
          .subscribe();
      } else if (this.type === 'final' && this.enrollment_id) {
        this.enrollmentService
          .addEnrollementFinalQuiz(this.enrollment_id)
          .subscribe();
      }
    } else {
      this.quizResultMessage = 'Some answers are incorrect. Please try again.';
    }

    this.quizCompletedModalVisible = true;
  }

  public tryAgain(): void {
    this.timeExpiredModalVisible = false;
    this.quizStarted = false;
    this.timeExpired = false;
    this.currentQuestionIndex = 0;
    this.quizCompletedModalVisible = false;
    this.initializeQuiz();

    setTimeout(() => {
      this.startModalVisible = true;
    }, 100);
  }
}
