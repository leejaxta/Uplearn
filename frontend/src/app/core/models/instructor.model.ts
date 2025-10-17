export interface CourseChart {
  course?: number;
  title: string;
  price: number;
  revenue: number;
  status: 'active' | 'inactive';
  totalEnrollments: number;
  weeklyEnrollments: WeeklyEnrollment[];
}

export interface InstructorAnalyticsResponse {
  instructorId: string;
  totalEnrollments: number;
  weeklyEnrollments: WeeklyEnrollment[];
  totalRevenue: number;
  courses: CourseChart[];
  totalCourses: number;
}

export interface WeeklyEnrollment {
  week: string;
  count: number;
}
