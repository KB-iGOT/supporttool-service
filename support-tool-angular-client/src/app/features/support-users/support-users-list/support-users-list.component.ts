
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User, ICreateUser } from './../models/support-users.model';
import { SupportUsersService } from './../services/support-users.service';
@Component({

  selector: 'app-support-users-list',
  standalone: false,
  templateUrl: './support-users-list.component.html',
  styleUrl: './support-users-list.component.scss'
})
export class SupportUsersListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  toasts = { message: '', open: false, severity: undefined as 'success' | 'error' | 'info' | 'warning' | undefined };
  
  createConfig = { visible: false, edit: false, user: null as User | null };
  deleteConfig = { visible: false, user: null as User | null };

  displayedColumns: string[] = ['name', 'username', 'userId', 'roles', 'actions'];

  constructor(
    private supportUserService: SupportUsersService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  handleToastClose(): void {
    this.toasts = { message: '', open: false, severity: undefined };
  }

  handleClickOpen(): void {
    this.createConfig = { visible: true, edit: false, user: null };
  }

  handleEditOpen(row: User): void {
    this.createConfig = { visible: true, edit: true, user: row };
  }

  handleClose(): void {
    this.createConfig = { visible: false, edit: false, user: null };
  }

  handleDeleteOpen(row: User): void {
    this.deleteConfig = { visible: true, user: row };
  }

  handleDeleteClose(): void {
    this.deleteConfig = { visible: false, user: null };
  }

  async handleDelete(userId: string | undefined): Promise<void> {
    try {
      const response = await this.supportUserService.deleteUser(userId).toPromise();
      if (response?.status === 204) {
        this.handleDeleteClose();
        this.showToast('User deleted successfully', 'success');
        this.fetchUsers();
      } else if (response?.message) {
        this.showToast(response.message, 'error');
      }
    } catch (er) {
      this.showToast((er as Error).message, 'error');
    }
  }

  async fetchUsers(): Promise<void> {
    this.loading = true;
    try {
      const users = await this.supportUserService.getUsers().toPromise();
      this.users = users ?? []; // Handle undefined case by defaulting to empty array
    } catch (error) {
      console.error('Error fetching users:', error);
      this.users = []; // Set to empty array on error
    }
    this.loading = false;
  }

  async handleSubmit(fields: ICreateUser, type: string): Promise<void> {
    try {
      if (type === 'create') {
        const response = await this.supportUserService.createUser(fields).toPromise();
        if (response?.status === 201) {
          this.showToast('User record created successfully', 'success');
          this.handleClose();
          this.fetchUsers();
        } else if (response?.message) {
          this.showToast(response.message, 'error');
        }
      } else if (type === 'edit') {
        const response = await this.supportUserService.updateUser(fields.userId, fields).toPromise();
        if (response?.status === 200) {
          this.showToast('User record updated successfully', 'success');
          this.handleClose();
          this.fetchUsers();
        } else if (response?.message) {
          this.showToast(response.message, 'error');
        }
      }
    } catch (er) {
      this.showToast((er as Error).message, 'error');
    }
  }

  private showToast(message: string, severity: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`mat-${severity}`]
    });
  }
  updateUser(userId: any,   user: User): void {
    this.users = this.users.map(u => u.id === userId ? user : u);
  }
}