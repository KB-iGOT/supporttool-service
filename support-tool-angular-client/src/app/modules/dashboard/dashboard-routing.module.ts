import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NTPCONSTANTS } from 'src/app/constants';
import { AuthGuard } from 'src/app/helpers/guards/authGuard';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const dashboardRoutes: Routes = [
  {
    path: NTPCONSTANTS.ROUTERLINKS.lIST, component: DashboardComponent,
    data: {
      breadcrumb: 'Dashboard',
    },
    canActivate: [AuthGuard]
  },
  { path: '',   redirectTo: NTPCONSTANTS.ROUTERLINKS.DASHBOARDLIST, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(dashboardRoutes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
