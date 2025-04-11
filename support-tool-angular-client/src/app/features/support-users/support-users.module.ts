import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportUsersListComponent } from './support-users-list/support-users-list.component';
import { RouterModule, Routes } from '@angular/router';
import { SupportUsersService } from './services/support-users.service';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

const routes: Routes = [
  {
    path: '',
    component: SupportUsersListComponent
  },
  {
    path: 'list',
    component: SupportUsersListComponent
  }
];

@NgModule({
  declarations: [
    SupportUsersListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatCardModule,
    RouterModule.forChild(routes)
  ],
  providers: [SupportUsersService]
})
export class SupportUsersModule { }
