import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorCourseOverviewComponent } from './instructor-course-overview.component';

describe('InstructorCourseOverviewComponent', () => {
  let component: InstructorCourseOverviewComponent;
  let fixture: ComponentFixture<InstructorCourseOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstructorCourseOverviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstructorCourseOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
