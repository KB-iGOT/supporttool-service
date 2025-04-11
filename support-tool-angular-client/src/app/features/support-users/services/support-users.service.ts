import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ICreateUser } from './../models/support-users.model';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class SupportUsersService {
  private apiUrl = `${environment.API_URL}/support-users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  createUser(user: ICreateUser): Observable<any> {
    return this.http.post<any>(this.apiUrl, user);
  }

  updateUser(userId: string | undefined, user: ICreateUser): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, user);
  }

  deleteUser(userId: string | undefined): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`);
  }
}