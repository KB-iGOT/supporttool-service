import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModulesRoutingModule } from './modules-routing.module';
import { ListComponent } from './components/list/list.component';
import { SharedModule } from '../shared/shared.module';
import { ModulesService } from 'src/app/helpers/services/admin/modules/modules.service';


@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    CommonModule,
    ModulesRoutingModule,
    SharedModule
  ],
  providers: [ModulesService]
})
export class ModulesModule { }
