import { Component, OnInit } from '@angular/core';
import { ModulesService } from 'src/app/helpers/services/admin/modules/modules.service';
import {IModules} from '../../../../helpers/interfaces/modules.interface';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public modulesList!: IModules[];

  constructor(private _modules: ModulesService) { }
  
  ngOnInit(): void {
    this.getModulesList();
  }

  getModulesList = () => {
    this._modules
    .getModulesList()
    .subscribe((res: any) => {
      if (res.statusCode === 200) {
        this.modulesList = res.result;
      }
    }, (error: any) => {
    });
  }

}
