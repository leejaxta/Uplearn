import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { formatWeekLabel } from '../../../../core/utils/utils';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';
import {
  CourseChart,
  WeeklyEnrollment,
} from '../../../../core/models/instructor.model';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-instructor-course-overview',
  templateUrl: './instructor-course-overview.component.html',
  styleUrl: './instructor-course-overview.component.scss',
})
export class InstructorCourseOverviewComponent implements OnInit {
  course: CourseChart = {
    title: '',
    price: 0,
    revenue: 0,
    status: 'active',
    totalEnrollments: 0,
    weeklyEnrollments: [],
  };
  public courseId!: number;

  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  weeklyChart!: Chart;

  constructor(
    private route: ActivatedRoute,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) {
      this.enrollmentService
        .getCourseOverview(this.courseId)
        .subscribe((data) => {
          this.course = data;
          this.createWeeklyChart();
        });
    }
  }

  public createWeeklyChart(): void {
    if (!this.weeklyChartRef?.nativeElement) return;

    const labels = this.course.weeklyEnrollments.map((w: WeeklyEnrollment) =>
      formatWeekLabel(w.week)
    );
    const data = this.course.weeklyEnrollments.map(
      (w: WeeklyEnrollment) => w.count
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Enrollments',
            data,
            backgroundColor: '#20b486',
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    };

    if (this.weeklyChart) this.weeklyChart.destroy();
    this.weeklyChart = new Chart(this.weeklyChartRef.nativeElement, config);
  }

  public exportChartAsImage(): void {
    if (!this.weeklyChart) return;

    const ctx = this.weeklyChart.ctx;
    const canvas = this.weeklyChart.canvas;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataUrl = this.weeklyChart.toBase64Image('image/png', 1);

    ctx.restore();

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `enrollments-${this.course.title || 'course'}.png`;
    link.click();
  }

  public exportDataAsCSV(): void {
    if (!this.course.weeklyEnrollments?.length) return;

    let csv = 'Week,Enrollments\n';
    this.course.weeklyEnrollments.forEach((item: WeeklyEnrollment) => {
      csv += `"${item.week}",${item.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enrollments-${this.course.title || 'course'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
