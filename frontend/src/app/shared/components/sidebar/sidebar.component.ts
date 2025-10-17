import { Component, OnInit } from '@angular/core';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  public isExpanded: boolean = true;
  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.searchService.isExpanded$.subscribe((val) => (this.isExpanded = val));
  }

  public toggleSidebar(): void {
    this.searchService.setExpanded(!this.isExpanded);
  }
}
