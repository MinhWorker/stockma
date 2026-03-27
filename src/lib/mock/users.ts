import { User } from '../../types/user';
import { delay } from './index';

const users: User[] = [
  {
    id: 1,
    name: 'Nguyen Van An',
    email: 'an.nguyen@warehouse.vn',
    role: 'admin',
    isActive: true,
    createdAt: '2023-10-01T08:00:00.000Z',
  },
  {
    id: 2,
    name: 'Tran Thi Bich',
    email: 'bich.tran@warehouse.vn',
    role: 'admin',
    isActive: true,
    createdAt: '2023-10-05T08:00:00.000Z',
  },
  {
    id: 3,
    name: 'Le Van Cuong',
    email: 'cuong.le@warehouse.vn',
    role: 'manager',
    isActive: true,
    createdAt: '2023-11-01T08:00:00.000Z',
  },
  {
    id: 4,
    name: 'Pham Thi Dung',
    email: 'dung.pham@warehouse.vn',
    role: 'manager',
    isActive: true,
    createdAt: '2023-11-15T08:00:00.000Z',
  },
  {
    id: 5,
    name: 'Hoang Van Em',
    email: 'em.hoang@warehouse.vn',
    role: 'manager',
    isActive: false,
    createdAt: '2023-12-01T08:00:00.000Z',
  },
  {
    id: 6,
    name: 'Vu Thi Phuong',
    email: 'phuong.vu@warehouse.vn',
    role: 'staff',
    isActive: true,
    createdAt: '2024-01-02T08:00:00.000Z',
  },
  {
    id: 7,
    name: 'Dang Van Giang',
    email: 'giang.dang@warehouse.vn',
    role: 'staff',
    isActive: true,
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    id: 8,
    name: 'Bui Thi Hoa',
    email: 'hoa.bui@warehouse.vn',
    role: 'staff',
    isActive: false,
    createdAt: '2024-01-20T08:00:00.000Z',
  },
];

export async function getMockUsers(): Promise<User[]> {
  await delay(300);
  return [...users];
}
