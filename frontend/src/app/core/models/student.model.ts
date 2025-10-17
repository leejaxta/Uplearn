export interface StudentCourseProgress {
  enrollmentId: number;
  courseId: number;
  courseTitle: string | null;
  courseImage: string | null;
  courseDescription: string | null;
  totalQuizzes: number;
  completedCount: number;
  progressPercentage: number;
  status: string;
  enrolledAt: string;
}
