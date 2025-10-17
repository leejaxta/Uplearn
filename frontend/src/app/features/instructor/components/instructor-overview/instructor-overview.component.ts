import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AuthService } from '../../../../core/services/auth.service';
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
import { formatWeekLabel } from '../../../../core/utils/utils';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-instructor-overview',
  templateUrl: './instructor-overview.component.html',
  styleUrl: './instructor-overview.component.scss',
})
export class InstructorOverviewComponent implements OnInit {
  totalEnrollments: number = 0;
  totalRevenue: number = 0;
  weeklyEnrollments: { week: string; count: number }[] = [];
  instructorId: string | null = null;

  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  weeklyChart!: Chart;

  constructor(
    private enrollmentService: EnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.instructorId = this.authService.getCurrentUser()?.uid!;
    if (this.instructorId) {
      this.enrollmentService
        .getInstructorOverview(this.instructorId)
        .subscribe((res: any) => {
          this.totalEnrollments = res.totalEnrollments;
          this.totalRevenue = res.totalRevenue;
          this.weeklyEnrollments = res.weeklyEnrollments || [];
          this.createWeeklyChart();
        });
    }
  }

  private createWeeklyChart(): void {
    if (!this.weeklyChartRef) return;

    const labels = this.weeklyEnrollments.map((w) => formatWeekLabel(w.week));

    const data = this.weeklyEnrollments.map((w) => w.count);

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
    link.download = 'weekly-enrollments-chart.png';
    link.click();
  }

  public exportDataAsCSV(): void {
    if (!this.weeklyEnrollments.length) return;

    let csv = 'Week,Enrollments\n';
    this.weeklyEnrollments.forEach((item) => {
      csv += `"${item.week}",${item.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'weekly-enrollments.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
