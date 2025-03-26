import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NTPCONSTANTS } from './constants';

const routes: Routes = [
  {
    path: NTPCONSTANTS.ROUTERLINKS.DASHBOARD, loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: NTPCONSTANTS.ROUTERLINKS.ADMIN.MODULES, loadChildren: () => import('./modules/modules/modules.module').then(m => m.ModulesModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
