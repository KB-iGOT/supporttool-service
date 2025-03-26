import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NTPCONSTANTS } from 'src/app/constants';
import { AuthGuard } from 'src/app/helpers/guards/authGuard';
import { ListComponent } from './components/list/list.component';

const modulesRoutes: Routes = [
  {
    path: NTPCONSTANTS.ROUTERLINKS.lIST, component: ListComponent,
    data: {
      breadcrumb: 'Modules',
    },
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(modulesRoutes)],
  exports: [RouterModule]
})
export class ModulesRoutingModule { }