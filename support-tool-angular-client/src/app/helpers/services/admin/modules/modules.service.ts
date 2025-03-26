import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { NTPTOOL } from 'src/app/constants';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {

  constructor(private http: HttpClient) { }

  public getModulesList() {
    return this.http.get(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.LIST);
  }

  public addNewModule(req: any) {
    return this.http.post(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.ADD, req);
  }

  public deleteModule(req: any) {
    return this.http.post(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.DELETE, req);
  }

  public readModule(req: any) {
    return this.http.post(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.READ, req);
  }

  public updateModule(req: any) {
    return this.http.post(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.UPDATE, req);
  }

  public getSubModules(req: any) {
    return this.http.post(environment.LOCALHOST + NTPTOOL.SUB.MODULES + NTPTOOL.API.SUB, req);
  }
}
