import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { CountUpDirective } from './directives/count-up.directive';
import { TruncatePipe } from './pipes/truncate.pipe';
import { FormsModule } from '@angular/forms';
import { ModelComponent } from './components/model/model.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToasterComponent } from './components/toaster/toaster.component';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [
    NavbarComponent,
    CountUpDirective,
    TruncatePipe,
    ModelComponent,
    SidebarComponent,
    ToasterComponent,
    FooterComponent,
  ],
  imports: [CommonModule, RouterModule, FormsModule],
  exports: [
    NavbarComponent,
    RouterModule,
    CountUpDirective,
    TruncatePipe,
    ModelComponent,
    SidebarComponent,
    ToasterComponent,
    FooterComponent,
  ],
})
export class SharedModule {}
