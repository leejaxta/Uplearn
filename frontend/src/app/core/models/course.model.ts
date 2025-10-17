export interface Quiz {
  id?: number;
  questions: Question[];
  pass: boolean;
}

export interface Question {
  q: string;
  options: string[];
  answer: string;
}

export interface file {
  name: string;
  path: string;
  types: string;
  size: number;
}

export interface Topic {
  title: string;
  description: string;
  quiz?: Quiz;
  docs?: File[];
  video?: File;
}

export interface TopicResponse {
  id?: number;
  courseId: number;
  title: string;
  description: string;
  quiz?: Quiz;
  files?: file[];
  video?: string;
}

export interface Course {
  id?: number;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorName: string;
  image?: File;
  topics: Topic[];
  finalQuiz?: Quiz;
}

export interface CourseResponse {
  id?: number;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorName: string;
  image?: string;
  topics: number[];
  finalQuiz?: Quiz;
}

export interface FormCourseResponse {
  id?: number;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorName: string;
  image?: string;
  topics: TopicResponse[];
  finalQuiz?: Quiz;
}

export interface UpdateCourseResponse {
  success: boolean;
  message: string;
  data: {
    course: CourseResponse;
    topics: TopicResponse[];
  };
}

export interface DeleteCourseResponse {
  success: boolean;
  message: string;
}

export interface UploadedFile {
  name: string;
  path: string;
}
