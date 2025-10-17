import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorOverviewComponent } from './instructor-overview.component';

describe('InstructorOverviewComponent', () => {
  let component: InstructorOverviewComponent;
  let fixture: ComponentFixture<InstructorOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstructorOverviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstructorOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
