import { Component, OnInit } from '@angular/core';
import { DashboardService } from 'src/app/helpers/services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboardValues: any = [];
  modules: any = [];
  adminModules: any = [];
  
  constructor(private _dashboard: DashboardService) { }

  ngOnInit(): void {
    this.getDashboardData();
  }

  getDashboardData = () => {
    this._dashboard
    .getDashboardData()
    .subscribe((res: any) => {
      if (res.status === 200 && res.responseCode === 'OK') {
        if (res.result && res.result.length > 0 ) { this.dashboardValues = res.result; }
        if (res.modules && res.modules.length > 0 ) { this.modules = res.modules; }
        if ( res.adminModules && res.adminModules.length > 0 ) { this.adminModules = res.adminModules; }
      }
    }, (error: any) => {
    });
  }

}
