export interface EnrollmentResponse {
  id: number;
  student_id: string;
  course_id: number;
  enrolled_at: string;
  status: string;
}

export interface PaymentResponse {
  id: number;
  student_id: string;
  course_id: number;
  payment_at: string;
  status: string;
}

export interface Enrollment_Topic_Progress extends Enrollment_Final_Quiz {
  topic_id: number;
}

export interface Enrollment_Final_Quiz {
  id: number;
  enrollment_id: number;
  complete_at: string;
}
