import { Transaction, TransactionFormValues, TransactionType } from '../../types/transaction';
import { delay } from './index';

let nextId = 101;

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// Product ids available: 1-30
// User ids: 1-8, names mapped below
const userNames: Record<number, string> = {
  1: 'Nguyen Van An',
  2: 'Tran Thi Bich',
  3: 'Le Van Cuong',
  4: 'Pham Thi Dung',
  5: 'Hoang Van Em',
  6: 'Vu Thi Phuong',
  7: 'Dang Van Giang',
  8: 'Bui Thi Hoa',
};

const productInfo: Record<number, { name: string; sku: string }> = {
  1: { name: 'Laptop Dell Inspiron 15', sku: 'ELEC-001' },
  2: { name: 'Wireless Mouse Logitech M185', sku: 'ELEC-002' },
  3: { name: 'USB-C Hub 7-in-1', sku: 'ELEC-003' },
  4: { name: 'Mechanical Keyboard TKL', sku: 'ELEC-004' },
  5: { name: 'Monitor 24 inch Full HD', sku: 'ELEC-005' },
  6: { name: 'Webcam HD 1080p', sku: 'ELEC-006' },
  7: { name: 'Ao thun nam co tron', sku: 'CLTH-001' },
  8: { name: 'Quan jean nam slim fit', sku: 'CLTH-002' },
  9: { name: 'Ao khoac gio nu', sku: 'CLTH-003' },
  10: { name: 'Giay the thao nam', sku: 'CLTH-004' },
  11: { name: 'Mu luoi trai unisex', sku: 'CLTH-005' },
  12: { name: 'Tui xach nu da PU', sku: 'CLTH-006' },
  13: { name: 'Ca phe rang xay Arabica', sku: 'FOOD-001' },
  14: { name: 'Tra xanh Oolong cao cap', sku: 'FOOD-002' },
  15: { name: 'Mat ong rung nguyen chat', sku: 'FOOD-003' },
  16: { name: 'Dau olive nguyen chat extra virgin', sku: 'FOOD-004' },
  17: { name: 'Hat dieu rang muoi', sku: 'FOOD-005' },
  18: { name: 'Nuoc ep trai cay huu co', sku: 'FOOD-006' },
  19: { name: 'Bo tua vit da nang 32 dau', sku: 'TOOL-001' },
  20: { name: 'May khoan cam tay 13mm', sku: 'TOOL-002' },
  21: { name: 'Thang nhom gap doi 3m', sku: 'TOOL-003' },
  22: { name: 'Bam biet dien tu', sku: 'TOOL-004' },
  23: { name: 'Keo cat da nang', sku: 'TOOL-005' },
  24: { name: 'Bang do cuon 5m', sku: 'TOOL-006' },
  25: { name: 'But bi xanh Thinh Vuong', sku: 'OFFC-001' },
  26: { name: 'Giay A4 IK Yellow 80gsm', sku: 'OFFC-002' },
  27: { name: 'Muc in HP 680 Black', sku: 'OFFC-003' },
  28: { name: 'Ghim bam Deli 24/6', sku: 'OFFC-004' },
  29: { name: 'Binder clip 32mm', sku: 'OFFC-005' },
  30: { name: 'So tay A5 bi mat', sku: 'OFFC-006' },
};

// Raw transaction seed data: [id, type, productId, quantity, stockBefore, userId, daysAgo, note]
type RawTx = [number, TransactionType, number, number, number, number, number, string];

const rawTransactions: RawTx[] = [
  [1, 'stock_in', 1, 10, 10, 1, 89, 'Nhap hang tu nha cung cap'],
  [2, 'stock_in', 2, 20, 0, 2, 88, 'Nhap hang dau ky'],
  [3, 'stock_in', 7, 50, 0, 1, 87, 'Nhap hang mua he'],
  [4, 'stock_out', 1, 2, 20, 3, 86, 'Ban le khach hang'],
  [5, 'stock_out', 7, 5, 50, 4, 85, 'Ban si cho dai ly'],
  [6, 'stock_in', 13, 80, 0, 2, 84, 'Nhap ca phe mua moi'],
  [7, 'stock_in', 25, 200, 0, 1, 83, 'Nhap van phong pham'],
  [8, 'stock_out', 2, 3, 20, 5, 82, 'Ban le'],
  [9, 'adjustment', 3, 5, 0, 1, 81, 'Kiem ke nhap bo sung'],
  [10, 'stock_in', 19, 30, 0, 3, 80, 'Nhap dung cu'],
  [11, 'stock_out', 13, 10, 80, 4, 79, 'Ban si'],
  [12, 'stock_in', 4, 20, 0, 2, 78, 'Nhap ban phim'],
  [13, 'stock_out', 25, 30, 200, 6, 77, 'Xuat van phong pham'],
  [14, 'stock_in', 16, 50, 0, 1, 76, 'Nhap dau olive'],
  [15, 'stock_out', 4, 3, 20, 3, 75, 'Ban le'],
  [16, 'stock_in', 10, 40, 0, 2, 74, 'Nhap giay the thao'],
  [17, 'stock_out', 16, 8, 50, 5, 73, 'Ban le'],
  [18, 'adjustment', 9, 5, 0, 1, 72, 'Nhap bo sung sau kiem ke'],
  [19, 'stock_in', 22, 20, 0, 3, 71, 'Nhap bam biet'],
  [20, 'stock_out', 10, 5, 40, 4, 70, 'Ban le'],
  [21, 'stock_in', 18, 150, 0, 2, 69, 'Nhap nuoc ep'],
  [22, 'stock_out', 19, 5, 30, 6, 68, 'Ban le dung cu'],
  [23, 'stock_in', 26, 40, 0, 1, 67, 'Nhap giay A4'],
  [24, 'stock_out', 18, 20, 150, 3, 66, 'Ban si nuoc ep'],
  [25, 'adjustment', 15, 3, 0, 1, 65, 'Nhap mat ong kiem ke'],
  [26, 'stock_in', 6, 15, 0, 2, 64, 'Nhap webcam'],
  [27, 'stock_out', 26, 10, 40, 5, 63, 'Xuat van phong pham'],
  [28, 'stock_in', 28, 100, 0, 1, 62, 'Nhap ghim bam'],
  [29, 'stock_out', 22, 4, 20, 4, 61, 'Ban le bam biet'],
  [30, 'stock_in', 30, 50, 0, 3, 60, 'Nhap so tay'],
  [31, 'stock_out', 6, 2, 15, 6, 59, 'Ban le webcam'],
  [32, 'stock_in', 8, 25, 0, 2, 58, 'Nhap quan jean'],
  [33, 'stock_out', 13, 8, 70, 1, 57, 'Ban le ca phe'],
  [34, 'adjustment', 20, 3, 0, 1, 56, 'Nhap may khoan kiem ke'],
  [35, 'stock_out', 30, 8, 50, 5, 55, 'Ban le so tay'],
  [36, 'stock_in', 5, 5, 0, 2, 54, 'Nhap man hinh'],
  [37, 'stock_out', 8, 5, 25, 3, 53, 'Ban le quan jean'],
  [38, 'stock_in', 14, 30, 0, 1, 52, 'Nhap tra oolong'],
  [39, 'stock_out', 28, 15, 100, 4, 51, 'Xuat ghim bam'],
  [40, 'stock_in', 24, 40, 0, 2, 50, 'Nhap bang do'],
  [41, 'stock_out', 14, 8, 30, 6, 49, 'Ban le tra'],
  [42, 'stock_in', 11, 20, 0, 1, 48, 'Nhap mu luoi trai'],
  [43, 'stock_out', 24, 8, 40, 3, 47, 'Ban le bang do'],
  [44, 'adjustment', 27, 5, 0, 1, 46, 'Nhap muc in kiem ke'],
  [45, 'stock_out', 11, 5, 20, 5, 45, 'Ban le mu'],
  [46, 'stock_in', 17, 30, 0, 2, 44, 'Nhap hat dieu'],
  [47, 'stock_out', 19, 6, 24, 4, 43, 'Ban le dung cu'],
  [48, 'stock_in', 12, 25, 0, 1, 42, 'Nhap tui xach'],
  [49, 'stock_out', 17, 10, 30, 6, 41, 'Ban le hat dieu'],
  [50, 'stock_in', 29, 25, 0, 3, 40, 'Nhap binder clip'],
  [51, 'stock_out', 12, 5, 25, 2, 39, 'Ban le tui xach'],
  [52, 'adjustment', 21, 2, 0, 1, 38, 'Nhap thang nhom kiem ke'],
  [53, 'stock_in', 23, 20, 0, 4, 37, 'Nhap keo cat'],
  [54, 'stock_out', 29, 8, 25, 5, 36, 'Xuat binder clip'],
  [55, 'stock_out', 23, 5, 20, 1, 35, 'Ban le keo cat'],
  [56, 'stock_in', 1, 5, 18, 2, 34, 'Nhap bo sung laptop'],
  [57, 'stock_out', 4, 2, 17, 3, 33, 'Ban le ban phim'],
  [58, 'stock_in', 7, 20, 45, 1, 32, 'Nhap bo sung ao thun'],
  [59, 'stock_out', 18, 10, 130, 4, 31, 'Ban si nuoc ep'],
  [60, 'adjustment', 2, -2, 17, 1, 30, 'Dieu chinh kiem ke'],
  [61, 'stock_out', 7, 8, 65, 6, 29, 'Ban le ao thun'],
  [62, 'stock_in', 3, 5, 5, 2, 28, 'Nhap bo sung USB hub'],
  [63, 'stock_out', 16, 5, 42, 3, 27, 'Ban le dau olive'],
  [64, 'stock_in', 2, 5, 15, 1, 26, 'Nhap bo sung chuot'],
  [65, 'stock_out', 13, 5, 62, 5, 25, 'Ban le ca phe'],
  [66, 'stock_in', 9, 3, 5, 2, 24, 'Nhap bo sung ao khoac'],
  [67, 'stock_out', 10, 3, 35, 4, 23, 'Ban le giay'],
  [68, 'adjustment', 26, -5, 30, 1, 22, 'Dieu chinh kiem ke giay A4'],
  [69, 'stock_out', 6, 1, 13, 6, 21, 'Ban le webcam'],
  [70, 'stock_in', 20, 2, 2, 3, 20, 'Nhap bo sung may khoan'],
  [71, 'stock_out', 14, 5, 22, 1, 19, 'Ban le tra'],
  [72, 'stock_in', 25, 50, 170, 2, 18, 'Nhap bo sung but bi'],
  [73, 'stock_out', 22, 3, 16, 5, 17, 'Ban le bam biet'],
  [74, 'stock_in', 15, 5, 0, 1, 16, 'Nhap mat ong moi'],
  [75, 'stock_out', 30, 5, 42, 4, 15, 'Ban le so tay'],
  [76, 'adjustment', 5, -1, 4, 1, 14, 'Dieu chinh kiem ke man hinh'],
  [77, 'stock_out', 28, 10, 85, 6, 13, 'Xuat ghim bam'],
  [78, 'stock_in', 11, 5, 15, 2, 12, 'Nhap bo sung mu'],
  [79, 'stock_out', 17, 5, 20, 3, 11, 'Ban le hat dieu'],
  [80, 'stock_in', 8, 5, 20, 1, 10, 'Nhap bo sung quan jean'],
  [81, 'stock_out', 24, 5, 32, 5, 9, 'Ban le bang do'],
  [82, 'adjustment', 12, -2, 20, 1, 8, 'Dieu chinh kiem ke tui xach'],
  [83, 'stock_out', 1, 1, 23, 4, 7, 'Ban le laptop'],
  [84, 'stock_in', 27, 3, 0, 2, 6, 'Nhap muc in moi'],
  [85, 'stock_out', 7, 5, 57, 6, 5, 'Ban le ao thun'],
  [86, 'stock_in', 29, 5, 17, 1, 4, 'Nhap bo sung binder clip'],
  [87, 'stock_out', 13, 3, 57, 3, 3, 'Ban le ca phe'],
  [88, 'adjustment', 19, -2, 18, 1, 2, 'Dieu chinh kiem ke dung cu'],
  [89, 'stock_out', 16, 3, 37, 5, 2, 'Ban le dau olive'],
  [90, 'stock_in', 4, 3, 15, 2, 1, 'Nhap bo sung ban phim'],
  [91, 'stock_out', 25, 20, 220, 4, 1, 'Xuat but bi van phong'],
  [92, 'stock_out', 18, 5, 120, 6, 1, 'Ban le nuoc ep'],
  [93, 'stock_in', 6, 2, 12, 1, 0, 'Nhap bo sung webcam'],
  [94, 'stock_out', 10, 2, 32, 3, 0, 'Ban le giay'],
  [95, 'adjustment', 14, -3, 17, 1, 0, 'Dieu chinh kiem ke tra'],
  [96, 'stock_out', 22, 2, 13, 5, 0, 'Ban le bam biet'],
  [97, 'stock_in', 26, 5, 25, 2, 0, 'Nhap bo sung giay A4'],
  [98, 'stock_out', 30, 3, 37, 4, 0, 'Ban le so tay'],
  [99, 'stock_out', 7, 3, 52, 6, 0, 'Ban le ao thun'],
  [100, 'stock_in', 2, 3, 13, 1, 0, 'Nhap bo sung chuot'],
];

const transactions: Transaction[] = rawTransactions.map(
  ([id, type, productId, quantity, stockBefore, userId, days, note]) => {
    const stockAfter = stockBefore + quantity;
    const info = productInfo[productId];
    return {
      id,
      type,
      productId,
      productName: info.name,
      productSku: info.sku,
      quantity,
      stockBefore,
      stockAfter,
      note,
      userId,
      userName: userNames[userId],
      createdAt: daysAgo(days),
    };
  }
);

export async function getMockTransactions(): Promise<Transaction[]> {
  await delay(500);
  return [...transactions];
}

export async function createMockTransaction(values: TransactionFormValues): Promise<Transaction> {
  await delay(1000);

  const info = productInfo[values.productId] ?? {
    name: 'Unknown Product',
    sku: 'UNKN-000',
  };

  const lastTx = transactions
    .filter((t) => t.productId === values.productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const stockBefore = lastTx ? lastTx.stockAfter : 0;
  const quantity =
    values.type === 'stock_out' ? -Math.abs(values.quantity) : Math.abs(values.quantity);
  const stockAfter = stockBefore + quantity;

  const newTransaction: Transaction = {
    id: nextId++,
    type: values.type,
    productId: values.productId,
    productName: info.name,
    productSku: info.sku,
    quantity,
    stockBefore,
    stockAfter,
    note: values.note,
    userId: 1,
    userName: userNames[1],
    createdAt: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  return { ...newTransaction };
}
