export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}
