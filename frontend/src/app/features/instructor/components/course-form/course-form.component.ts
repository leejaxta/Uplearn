import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../../../core/services/course.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UploadedFile } from '../../../../core/models/course.model';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss',
})
export class CourseFormComponent implements OnInit {
  @Input() courseId: number | null = null;
  @Output() saved: EventEmitter<void> = new EventEmitter<void>();
  @Output() canceled: EventEmitter<void> = new EventEmitter<void>();

  public existingVideos: { [topicIndex: number]: UploadedFile } = {};
  public existingDocs: { [topicIndex: number]: UploadedFile[] } = {};

  public courseForm: FormGroup;
  public imagePreview: string | null = null;
  private imageInput!: HTMLInputElement;

  private validationErrors: { [key: string]: string } = {};
  private topicErrors: { [key: string]: string } = {};
  private questionErrors: { [key: string]: string } = {};
  private finalQuizErrors: { [key: string]: string } = {};

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private authService: AuthService,
    private toaster: ToasterService
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      image: [null],
      topics: this.fb.array([]),
      finalQuiz: this.fb.group({
        pass: [false],
        questions: this.fb.array([]),
      }),
    });
  }

  ngOnInit(): void {
    if (this.courseId) {
      this.loadCourseForEdit(this.courseId);
    }
  }

  public onImageChange(event: any): void {
    const file = event.target.files[0];
    this.imageInput = event.target;
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.setValidationError('image', 'Please select a valid image file');
        return;
      }

      this.clearValidationError('image');
      this.courseForm.patchValue({ image: file });

      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  public removeImage(): void {
    this.courseForm.patchValue({ image: null });
    this.imagePreview = null;
    if (this.imageInput) {
      this.imageInput.value = '';
    }
    this.clearValidationError('image');
  }

  get topics(): FormArray {
    return this.courseForm.get('topics') as FormArray;
  }

  public addTopic(): void {
    this.topics.push(
      this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        quiz: this.fb.group({
          pass: [false],
          questions: this.fb.array([]),
        }),
        docs: [null],
        video: [null],
      })
    );
    this.clearValidationError('topics');
  }

  public removeTopic(index: number): void {
    this.topics.removeAt(index);
    Object.keys(this.topicErrors).forEach((key) => {
      if (key.startsWith(`topic-${index}-`)) {
        delete this.topicErrors[key];
      }
    });
  }

  public onFileChange(event: any, index: number, type: 'video' | 'docs'): void {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (type === 'video') {
      const file = files[0];
      if (!file.type.startsWith('video/')) {
        this.setTopicError(index, 'video', 'Please select a valid video file');
        return;
      }
      this.clearTopicError(index, 'video');
      this.topics.at(index).patchValue({ video: file });
    } else {
      const fileArray = Array.from(files) as File[];
      const validFiles = fileArray.filter((file) => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        return validTypes.includes(file.type);
      });

      if (validFiles.length !== fileArray.length) {
        this.setTopicError(
          index,
          'docs',
          'Please select only PDF, Word, or text documents'
        );
        return;
      }

      this.clearTopicError(index, 'docs');
      this.topics.at(index).patchValue({ docs: validFiles });
    }
  }

  public getQuestions(topicIndex: number): FormArray {
    return this.topics
      .at(topicIndex)
      .get('quiz')
      ?.get('questions') as FormArray;
  }

  public addQuestion(topicIndex: number): void {
    const optionsArray = this.fb.array([
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
    ]);
    this.getQuestions(topicIndex).push(
      this.fb.group({
        q: ['', Validators.required],
        options: optionsArray,
        answer: ['', Validators.required],
      })
    );
    this.clearTopicError(topicIndex, 'questions');
  }

  public removeQuestion(topicIndex: number, qIndex: number): void {
    this.getQuestions(topicIndex).removeAt(qIndex);
    Object.keys(this.questionErrors).forEach((key) => {
      if (key.startsWith(`topic-${topicIndex}-question-${qIndex}-`)) {
        delete this.questionErrors[key];
      }
    });
  }

  public getOptions(topicIndex: number, qIndex: number): FormArray {
    return this.getQuestions(topicIndex).at(qIndex).get('options') as FormArray;
  }

  get finalQuizQuestions(): FormArray {
    return this.courseForm.get('finalQuiz')?.get('questions') as FormArray;
  }

  public addFinalQuestion(): void {
    const optionsArray = this.fb.array([
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
    ]);
    this.finalQuizQuestions.push(
      this.fb.group({
        q: ['', Validators.required],
        options: optionsArray,
        answer: ['', Validators.required],
      })
    );
    this.clearValidationError('finalQuiz');
  }

  public removeFinalQuestion(qIndex: number): void {
    this.finalQuizQuestions.removeAt(qIndex);
    Object.keys(this.finalQuizErrors).forEach((key) => {
      if (key.startsWith(`final-question-${qIndex}-`)) {
        delete this.finalQuizErrors[key];
      }
    });
  }

  public getFinalQuizOptions(qIndex: number): FormArray {
    return this.finalQuizQuestions.at(qIndex).get('options') as FormArray;
  }

  private setValidationError(field: string, message: string): void {
    this.validationErrors[field] = message;
  }

  private clearValidationError(field: string): void {
    delete this.validationErrors[field];
  }

  private setTopicError(
    topicIndex: number,
    field: string,
    message: string
  ): void {
    this.topicErrors[`topic-${topicIndex}-${field}`] = message;
  }

  private clearTopicError(topicIndex: number, field: string): void {
    delete this.topicErrors[`topic-${topicIndex}-${field}`];
  }

  private setQuestionError(
    topicIndex: number,
    qIndex: number,
    field: string,
    message: string
  ): void {
    this.questionErrors[`topic-${topicIndex}-question-${qIndex}-${field}`] =
      message;
  }

  private setFinalQuestionError(
    qIndex: number,
    field: string,
    message: string
  ): void {
    this.finalQuizErrors[`final-question-${qIndex}-${field}`] = message;
  }

  public showError(field: string): boolean {
    return !!this.validationErrors[field];
  }

  public getErrorMessage(field: string): string {
    return this.validationErrors[field] || '';
  }

  public showTopicError(topicIndex: number, field: string): boolean {
    return !!this.topicErrors[`topic-${topicIndex}-${field}`];
  }

  public getTopicErrorMessage(topicIndex: number, field: string): string {
    return this.topicErrors[`topic-${topicIndex}-${field}`] || '';
  }

  public hasTopicError(topicIndex: number): boolean {
    return Object.keys(this.topicErrors).some(
      (key) =>
        key.startsWith(`topic-${topicIndex}-`) &&
        key !== `topic-${topicIndex}-questions`
    );
  }

  public showQuestionError(
    topicIndex: number,
    qIndex: number,
    field: string
  ): boolean {
    return !!this.questionErrors[
      `topic-${topicIndex}-question-${qIndex}-${field}`
    ];
  }

  public getQuestionErrorMessage(
    topicIndex: number,
    qIndex: number,
    field: string
  ): string {
    return (
      this.questionErrors[`topic-${topicIndex}-question-${qIndex}-${field}`] ||
      ''
    );
  }

  public hasQuestionError(topicIndex: number, qIndex: number): boolean {
    return Object.keys(this.questionErrors).some((key) =>
      key.startsWith(`topic-${topicIndex}-question-${qIndex}-`)
    );
  }

  public showOptionError(
    topicIndex: number,
    qIndex: number,
    optionIndex: number
  ): boolean {
    return this.showQuestionError(topicIndex, qIndex, `option-${optionIndex}`);
  }

  public getOptionErrorMessage(
    topicIndex: number,
    qIndex: number,
    optionIndex: number
  ): string {
    return this.getQuestionErrorMessage(
      topicIndex,
      qIndex,
      `option-${optionIndex}`
    );
  }

  public showFinalQuestionError(qIndex: number, field: string): boolean {
    return !!this.finalQuizErrors[`final-question-${qIndex}-${field}`];
  }

  public getFinalQuestionErrorMessage(qIndex: number, field: string): string {
    return this.finalQuizErrors[`final-question-${qIndex}-${field}`] || '';
  }

  public hasFinalQuestionError(qIndex: number): boolean {
    return Object.keys(this.finalQuizErrors).some((key) =>
      key.startsWith(`final-question-${qIndex}-`)
    );
  }

  public showFinalOptionError(qIndex: number, optionIndex: number): boolean {
    return this.showFinalQuestionError(qIndex, `option-${optionIndex}`);
  }

  public getFinalOptionErrorMessage(
    qIndex: number,
    optionIndex: number
  ): string {
    return this.getFinalQuestionErrorMessage(qIndex, `option-${optionIndex}`);
  }

  private validateForm(): boolean {
    this.validationErrors = {};
    this.topicErrors = {};
    this.questionErrors = {};
    this.finalQuizErrors = {};

    let hasErrors: boolean = false;

    if (this.courseForm.get('title')?.invalid) {
      this.setValidationError('title', 'Course title is required');
      hasErrors = true;
    }

    if (this.courseForm.get('description')?.invalid) {
      this.setValidationError('description', 'Course description is required');
      hasErrors = true;
    }

    if (this.courseForm.get('price')?.invalid) {
      this.setValidationError(
        'price',
        'Valid price is required (must be 0 or greater)'
      );
      hasErrors = true;
    }

    if (this.topics.length === 0) {
      this.setValidationError('topics', 'At least one topic is required');
      hasErrors = true;
    }

    this.topics.controls.forEach((topic, index) => {
      if (topic.get('title')?.invalid) {
        this.setTopicError(
          index,
          'title',
          `Topic ${index + 1} title is required`
        );
        hasErrors = true;
      }

      if (topic.get('description')?.invalid) {
        this.setTopicError(
          index,
          'description',
          `Topic ${index + 1} description is required`
        );
        hasErrors = true;
      }

      const hasNewVideo = !!topic.get('video')?.value;
      const hasExistingVideo = !!this.existingVideos[index];
      if (!hasNewVideo && !hasExistingVideo) {
        this.setTopicError(
          index,
          'video',
          `Topic ${index + 1} must have a video`
        );
        hasErrors = true;
      }

      const newDocs = topic.get('docs')?.value;
      const hasNewDocs = newDocs && newDocs.length > 0;
      const hasExistingDocs =
        this.existingDocs[index] && this.existingDocs[index].length > 0;

      if (!hasNewDocs && !hasExistingDocs) {
        this.setTopicError(
          index,
          'docs',
          `Topic ${index + 1} must have at least one document`
        );
        hasErrors = true;
      }

      const questions = topic.get('quiz')?.get('questions') as FormArray;
      if (questions.length < 1) {
        this.setTopicError(
          index,
          'questions',
          `Topic ${index + 1} must have at least 1 quiz question`
        );
        hasErrors = true;
      }

      questions.controls.forEach((question, qIndex) => {
        if (question.get('q')?.invalid) {
          this.setQuestionError(
            index,
            qIndex,
            'q',
            `Topic ${index + 1}, Question ${
              qIndex + 1
            }: Question text is required`
          );
          hasErrors = true;
        }

        if (question.get('answer')?.invalid) {
          this.setQuestionError(
            index,
            qIndex,
            'answer',
            `Topic ${index + 1}, Question ${
              qIndex + 1
            }: Correct answer is required`
          );
          hasErrors = true;
        }

        const options = question.get('options') as FormArray;
        if (options.length !== 4) {
          this.setQuestionError(
            index,
            qIndex,
            'options',
            `Topic ${index + 1}, Question ${
              qIndex + 1
            }: Exactly 4 options must be provided`
          );
          hasErrors = true;
        }

        options.controls.forEach((opt, oi) => {
          if (opt.invalid) {
            this.setQuestionError(
              index,
              qIndex,
              `option-${oi}`,
              `Topic ${index + 1}, Question ${qIndex + 1}, Option ${
                oi + 1
              }: Option text is required`
            );
            hasErrors = true;
          }
        });
      });
    });

    const finalQuestions = this.finalQuizQuestions;
    if (finalQuestions.length < 1) {
      this.setValidationError(
        'finalQuiz',
        'Final assessment must have at least 1 questions'
      );
      hasErrors = true;
    }

    finalQuestions.controls.forEach((question, qIndex) => {
      if (question.get('q')?.invalid) {
        this.setFinalQuestionError(
          qIndex,
          'q',
          `Final Quiz, Question ${qIndex + 1}: Question text is required`
        );
        hasErrors = true;
      }

      if (question.get('answer')?.invalid) {
        this.setFinalQuestionError(
          qIndex,
          'answer',
          `Final Quiz, Question ${qIndex + 1}: Correct answer is required`
        );
        hasErrors = true;
      }

      const options = question.get('options') as FormArray;
      if (options.length !== 4) {
        this.setFinalQuestionError(
          qIndex,
          'options',
          `Final Quiz, Question ${
            qIndex + 1
          }: Exactly 4 options must be provided`
        );
        hasErrors = true;
      }

      options.controls.forEach((opt, oi) => {
        if (opt.invalid) {
          this.setFinalQuestionError(
            qIndex,
            `option-${oi}`,
            `Final Quiz, Question ${qIndex + 1}, Option ${
              oi + 1
            }: Option text is required`
          );
          hasErrors = true;
        }
      });
    });

    return !hasErrors;
  }

  public submit(): void {
    if (!this.validateForm()) {
      this.toaster.showError(
        'Please fix all validation errors before submitting.'
      );
      this.scrollToFirstError();
      return;
    }

    const course = this.courseForm.value;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toaster.showError('Please login to create/update a course');
      return;
    }

    const instructorId = currentUser.uid;
    course.instructorId = instructorId;

    const instructorName = currentUser.displayName || 'Unknown Instructor';
    course.instructorName = instructorName;

    const formData = new FormData();
    formData.append('data', JSON.stringify(course));

    const fileTypes: string[] = [];
    const topicIndices: string[] = [];

    const courseImage = this.courseForm.get('image')?.value as File;
    if (courseImage) {
      formData.append('files', courseImage, courseImage.name);
      fileTypes.push('image');
      topicIndices.push('-1');
    }

    course.topics.forEach((topic: any, idx: number) => {
      if (topic.docs && topic.docs.length > 0) {
        topic.docs.forEach((doc: File) => {
          formData.append('files', doc, doc.name);
          fileTypes.push('doc');
          topicIndices.push(idx.toString());
        });
      }

      if (topic.video) {
        formData.append('files', topic.video, topic.video.name);
        fileTypes.push('video');
        topicIndices.push(idx.toString());
      }
    });

    const existingFileTypes: string[] = [];
    const existingTopicIndices: string[] = [];

    Object.keys(this.existingVideos).forEach((topicIndexStr) => {
      const topicIndex = parseInt(topicIndexStr);
      if (!this.topics.at(topicIndex).get('video')?.value) {
        existingFileTypes.push('video');
        existingTopicIndices.push(topicIndex.toString());
      }
    });

    Object.keys(this.existingDocs).forEach((topicIndexStr) => {
      const topicIndex = parseInt(topicIndexStr);
      const docs = this.existingDocs[topicIndex];
      if (docs && docs.length > 0) {
        const newDocs = this.topics.at(topicIndex).get('docs')?.value;
        if (!newDocs || newDocs.length === 0) {
          docs.forEach(() => {
            existingFileTypes.push('doc');
            existingTopicIndices.push(topicIndex.toString());
          });
        }
      }
    });

    existingFileTypes.forEach((type) => {
      formData.append('existingFileTypes', type);
    });

    existingTopicIndices.forEach((index) => {
      formData.append('existingTopicIndices', index);
    });

    fileTypes.forEach((type) => {
      formData.append('fileTypes', type);
    });

    topicIndices.forEach((index) => {
      formData.append('topicIndices', index);
    });

    if (this.courseId) {
      this.courseService.updateCourse(this.courseId, formData).subscribe({
        next: () => {
          this.toaster.showSuccess('Course updated successfully!');
          this.saved.emit();
        },
        error: (err) => {
          this.toaster.showError('Error updating course. Please try again.');
        },
      });
    } else {
      this.courseService.createCourse(formData).subscribe({
        next: () => {
          this.toaster.showSuccess('Course created successfully!');
          this.saved.emit();
        },
        error: (err) => {
          this.toaster.showError('Error creating course. Please try again.');
        },
      });
    }
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const errorElements = document.querySelectorAll(
        '.is-invalid, .border-danger'
      );
      if (errorElements.length > 0) {
        errorElements[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  public cancel(): void {
    this.canceled.emit();
  }

  private loadCourseForEdit(courseId: number): void {
    this.courseService.getCourseWithTopics(courseId).subscribe({
      next: (course) => {
        this.courseForm.patchValue({
          title: course.title,
          description: course.description,
          price: course.price,
          finalQuiz: course.finalQuiz || { pass: false, questions: [] },
        });

        if (course.image) {
          this.imagePreview = course.image;
        }

        while (this.topics.length) {
          this.topics.removeAt(0);
        }

        this.existingVideos = {};
        this.existingDocs = {};

        course.topics.forEach((topic: any, idx: number) => {
          const topicGroup = this.fb.group({
            title: [topic.title, Validators.required],
            description: [topic.description, Validators.required],
            quiz: this.fb.group({
              pass: [topic.quiz?.pass || false],
              questions: this.fb.array([]),
            }),
            docs: [null],
            video: [null],
          });

          if (topic.video) {
            this.existingVideos[idx] = {
              name: this.extractFileName(topic.video),
              path: topic.video,
            };
          }

          if (topic.files && topic.files.length > 0) {
            this.existingDocs[idx] = topic.files.map((file: any) => ({
              name: this.extractFileName(file.path),
              path: file.path,
            }));
          }

          const questionsArray = topicGroup
            .get('quiz')
            ?.get('questions') as FormArray;
          topic.quiz?.questions?.forEach((q: any) => {
            const optionsArray = this.fb.array(
              q.options.map((opt: string) =>
                this.fb.control(opt, Validators.required)
              )
            );
            questionsArray.push(
              this.fb.group({
                q: [q.q, Validators.required],
                options: optionsArray,
                answer: [q.answer, Validators.required],
              })
            );
          });

          this.topics.push(topicGroup);
        });

        const finalQuizArray = this.finalQuizQuestions;
        while (finalQuizArray.length) {
          finalQuizArray.removeAt(0);
        }

        course.finalQuiz?.questions?.forEach((q: any) => {
          const optionsArray = this.fb.array(
            q.options.map((opt: string) =>
              this.fb.control(opt, Validators.required)
            )
          );
          finalQuizArray.push(
            this.fb.group({
              q: [q.q, Validators.required],
              options: optionsArray,
              answer: [q.answer, Validators.required],
            })
          );
        });
      },
      error: (err) => {
        console.error('Failed to load course for editing.', err);
        this.toaster.showError('Failed to load course for editing');
      },
    });
  }

  private extractFileName(url: string): string {
    return url.split('/').pop() || 'Unknown File';
  }

  public clearExistingVideo(topicIndex: number): void {
    delete this.existingVideos[topicIndex];
    this.clearTopicError(topicIndex, 'video');
  }

  public removeExistingDoc(topicIndex: number, docIndex: number): void {
    this.existingDocs[topicIndex].splice(docIndex, 1);
    if (this.existingDocs[topicIndex].length === 0) {
      delete this.existingDocs[topicIndex];
    }
  }
}
