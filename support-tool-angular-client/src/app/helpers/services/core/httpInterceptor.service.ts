import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { User } from "../../interfaces/user.interface";
@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

    constructor() { }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let currentUser: User[] = [];
        currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.length > 0) {
            request = request.clone({
                setHeaders: {
                    contentType: 'application/json',
                    userId: currentUser[0]['userId']
                }
            });
        }
        return next.handle(request);
    }
}
