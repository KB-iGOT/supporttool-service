export interface User {
  id: number;
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  roles: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
}

export interface ICreateUser {
  userId: string | undefined;
  userName: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  roles: string | undefined;
}
