# Quản Lý Kho Hàng

Hệ thống quản lý tồn kho toàn diện để theo dõi sản phẩm, mức tồn kho và hoạt động kho bãi theo thời gian thực.

## Tổng Quan

Quản Lý Kho Hàng là ứng dụng web hiện đại được thiết kế để tối ưu hóa kiểm soát hàng tồn kho, tự động hóa theo dõi kho và cung cấp thông tin chi tiết hữu ích thông qua báo cáo và phân tích. Được xây dựng cho các doanh nghiệp ở mọi quy mô, từ cửa hàng bán lẻ nhỏ đến hoạt động đa kho.

## Tính Năng Chính

### Quản Lý Sản Phẩm

- Danh mục sản phẩm với SKU, mã vạch và phân loại danh mục
- Hỗ trợ đa biến thể (kích thước, màu sắc, v.v.)
- Hình ảnh và mô tả chi tiết sản phẩm
- Quản lý giá (giá vốn, giá bán lẻ, giá sỉ)
- Cảnh báo tồn kho thấp và điểm đặt hàng lại
- Theo dõi số lô và số serial

### Kiểm Soát Tồn Kho

- Theo dõi mức tồn kho theo thời gian thực tại nhiều địa điểm
- Ghi nhật ký giao dịch nhập/xuất kho
- Điều chỉnh tồn kho với mã lý do
- Chuyển kho giữa các kho/địa điểm
- Hỗ trợ kiểm kê định kỳ và kiểm kê thực tế
- Phương pháp tính giá FIFO/LIFO/Bình quân

### Vận Hành Kho Bãi

- Quản lý đa kho/địa điểm
- Theo dõi vị trí kệ/ngăn
- Quy trình nhận hàng và sắp xếp
- Quy trình lấy hàng và đóng gói
- Sẵn sàng tích hợp vận chuyển
- Hỗ trợ quét mã vạch

### Báo Cáo & Phân Tích

- Mức tồn kho và định giá hiện tại
- Lịch sử di chuyển hàng hóa
- Báo cáo tồn kho thấp và tồn kho dư thừa
- Phân tích vòng quay hàng tồn kho
- Nhật ký kiểm toán giao dịch
- Báo cáo tùy chỉnh theo khoảng thời gian
- Xuất ra CSV/Excel

### Quản Lý Người Dùng

- Kiểm soát truy cập dựa trên vai trò (Quản trị viên, Quản lý, Nhân viên)
- Ghi nhật ký hoạt động và kiểm toán
- Truy cập đồng thời nhiều người dùng
- Bảng điều khiển riêng cho từng người dùng

## Công Nghệ Sử Dụng

- **Framework**: Next.js 15 với App Router
- **Ngôn ngữ**: TypeScript
- **Cơ sở dữ liệu**: PostgreSQL (khuyến nghị) / MySQL / SQLite
- **ORM**: Prisma / Drizzle
- **Giao diện**: React với Tailwind CSS
- **Quản lý State**: React Server Components + Client hooks
- **Xác thực**: NextAuth.js / Clerk
- **Triển khai**: Vercel / Docker

## Bắt Đầu

### Yêu Cầu

```bash
Node.js 18+
npm / yarn / pnpm
Cơ sở dữ liệu (khuyến nghị PostgreSQL)
```

### Cài Đặt

```bash
# Clone repository
git clone <repository-url>
cd stock-manager

# Cài đặt dependencies
npm install

# Thiết lập biến môi trường
cp .env.example .env.local
# Chỉnh sửa .env.local với cấu hình database của bạn

# Chạy database migrations
npm run db:migrate

# Seed dữ liệu ban đầu (tùy chọn)
npm run db:seed

# Khởi động server development
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để truy cập ứng dụng.

### Biến Môi Trường

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockmanager"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Cấu Trúc Dự Án

```
├── app/                    # Thư mục app Next.js
│   ├── (auth)/            # Trang xác thực
│   ├── (dashboard)/       # Trang ứng dụng chính
│   │   ├── products/      # Quản lý sản phẩm
│   │   ├── inventory/     # Vận hành kho
│   │   ├── transactions/  # Hoạt động nhập/xuất
│   │   ├── reports/       # Phân tích và báo cáo
│   │   └── settings/      # Cấu hình
│   └── api/               # API routes
├── components/            # UI components tái sử dụng
├── lib/                   # Tiện ích và helpers
│   ├── db/               # Database client và queries
│   ├── validations/      # Zod schemas
│   └── utils/            # Hàm helper
├── prisma/               # Database schema và migrations
└── public/               # Tài nguyên tĩnh
```

## Quy Trình Chính

### Nhập Kho

1. Tạo đơn đặt hàng hoặc phiếu nhập trực tiếp
2. Quét/nhập sản phẩm và số lượng
3. Phân bổ vào vị trí kho
4. Hệ thống tự động cập nhật mức tồn kho
5. Tạo chứng từ nhập kho

### Xuất Kho

1. Tạo đơn bán hàng hoặc phiếu xuất thủ công
2. Lấy hàng từ các vị trí
3. Xác minh số lượng
4. Hệ thống trừ khỏi tồn kho
5. Tạo phiếu đóng gói

### Chuyển Kho

1. Chọn địa điểm nguồn và đích
2. Chọn sản phẩm và số lượng
3. Khởi tạo chuyển kho
4. Nhận tại đích
5. Cả hai địa điểm được cập nhật tự động

### Điều Chỉnh Tồn Kho

1. Cần kiểm đếm thực tế hoặc điều chỉnh
2. Nhập số lượng thực tế
3. Cung cấp mã lý do
4. Hệ thống tính toán chênh lệch
5. Tạo nhật ký kiểm toán

## Lộ Trình

### Giai Đoạn 1 (MVP)

- [x] CRUD sản phẩm cơ bản
- [ ] Nhập/xuất kho đơn giản
- [ ] Hỗ trợ kho đơn
- [ ] Báo cáo cơ bản
- [ ] Xác thực người dùng

### Giai Đoạn 2

- [ ] Hỗ trợ đa kho
- [ ] Quét mã vạch
- [ ] Báo cáo nâng cao
- [ ] Cảnh báo tồn kho thấp
- [ ] Chuyển kho

### Giai Đoạn 3

- [ ] Quản lý đơn đặt hàng
- [ ] Quản lý nhà cung cấp
- [ ] Ứng dụng di động
- [ ] API cho tích hợp
- [ ] Phân tích nâng cao

### Giai Đoạn 4

- [ ] Hỗ trợ đa tiền tệ
- [ ] Marketplace tích hợp
- [ ] Đặt hàng tự động
- [ ] Dự báo và lập kế hoạch nhu cầu
- [ ] Tích hợp thiết bị IoT

## Phát Triển

```bash
# Chạy server development
npm run dev

# Chạy tests
npm run test

# Chạy linting
npm run lint

# Build cho production
npm run build

# Khởi động server production
npm start
```

## Schema Cơ Sở Dữ Liệu

Các thực thể chính:

- **Products**: Thông tin sản phẩm cốt lõi
- **Variants**: Biến thể sản phẩm (kích thước, màu sắc)
- **Locations**: Kho và vị trí lưu trữ
- **Inventory**: Mức tồn kho hiện tại theo sản phẩm/địa điểm
- **Transactions**: Tất cả di chuyển kho (nhập/xuất/chuyển/điều chỉnh)
- **Users**: Người dùng hệ thống và quyền hạn

## Đóng Góp

Chào đón mọi đóng góp! Vui lòng đọc hướng dẫn đóng góp trước khi gửi PR.

## Giấy Phép

[Giấy Phép Của Bạn]

## Hỗ Trợ

Đối với các vấn đề và câu hỏi:

- GitHub Issues: [repository-url]/issues
- Tài liệu: [docs-url]
- Email: support@example.com
