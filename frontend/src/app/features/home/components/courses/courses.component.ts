import { Component, HostListener, OnInit } from '@angular/core';
import { CourseService } from '../../../../core/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { BehaviorSubject } from 'rxjs';
import { SearchService } from '../../../../core/services/search.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent implements OnInit {
  public allCourses: Course[] = [];
  public filteredCourses$: BehaviorSubject<Course[]> = new BehaviorSubject<
    Course[]
  >([]);
  public searchText: string = '';
  public filterBy: 'all' | 'course' | 'instructor' = 'all';
  public priceFilter: 'all' | 'free' | 'paid' = 'all';
  public minPrice: number | null = null;
  public maxPrice: number | null = null;
  public sortBy: 'default' | 'priceLowToHigh' | 'priceHighToLow' = 'default';
  public isLoading: boolean = true;

  constructor(
    private courseService: CourseService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.courseService.getAllCourses().subscribe((courses) => {
      this.allCourses = courses.map((course) => ({
        ...course,
      }));

      if (this.searchText) {
        this.applyFilters();
        this.isLoading = false;
      } else {
        this.filteredCourses$.next([...this.allCourses]);
        this.filterBy = 'all';
        this.isLoading = false;
      }
    });

    this.searchService.search$.subscribe((search) => {
      this.searchText = search;
      this.applyFilters();
    });
  }

  public applyFilters(): void {
    let filtered = [...this.allCourses];

    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase().trim();

      filtered = filtered.filter((course) => {
        switch (this.filterBy) {
          case 'course':
            return course.title.toLowerCase().includes(searchTerm);
          case 'instructor':
            return course.instructorName.toLowerCase().includes(searchTerm);
          case 'all':
          default:
            return (
              course.title.toLowerCase().includes(searchTerm) ||
              course.instructorName.toLowerCase().includes(searchTerm)
            );
        }
      });
    }

    if (this.priceFilter !== 'all') {
      filtered = filtered.filter((course) => {
        if (this.priceFilter === 'free') {
          return course.price === 0;
        } else if (this.priceFilter === 'paid') {
          return course.price > 0;
        }
        return true;
      });
    }

    if (this.minPrice !== null) {
      filtered = filtered.filter((course) => course.price >= this.minPrice!);
    }

    if (this.maxPrice !== null) {
      filtered = filtered.filter((course) => course.price <= this.maxPrice!);
    }

    filtered = this.sortCourses(filtered);

    this.filteredCourses$.next(filtered);
  }

  public sortCourses(courses: Course[]): Course[] {
    if (this.sortBy === 'priceLowToHigh') {
      return [...courses].sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'priceHighToLow') {
      return [...courses].sort((a, b) => b.price - a.price);
    }
    return courses;
  }

  public clearFilters(): void {
    this.searchService.clearSearch();
    this.searchText = '';
    this.filterBy = 'all';
    this.priceFilter = 'all';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'default';
    this.filteredCourses$.next([...this.allCourses]);
  }

  public clearPriceRange(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilters();
  }
}
