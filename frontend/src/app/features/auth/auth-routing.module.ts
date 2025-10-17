import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignupComponent } from './components/signup/signup.component';
import { RoleComponent } from './components/role/role.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  {
    path: 'signup',
    component: RoleComponent,
  },
  {
    path: 'signup/:type',
    component: SignupComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
