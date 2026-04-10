# SPEC — Hệ Thống Quản Lý Phòng Khám Thú Y & Cửa Hàng Chăm Sóc Thú Cưng

> **Veterinary Clinic & Pet Shop Management System**
> Version: 1.0 | Last updated: 2026-04-10

---

## 1. Tổng quan dự án

### 1.1 Mục tiêu

Xây dựng hệ thống web quản lý toàn diện hoạt động của phòng khám thú y kết hợp cửa hàng thú cưng, bao gồm:

- **Bán lẻ sản phẩm**: thức ăn, phụ kiện, thuốc thú y
- **Dịch vụ y tế**: khám bệnh, trị bệnh, tiêm phòng, phẫu thuật
- **Dịch vụ làm đẹp**: spa, grooming, tắm rửa
- **Dịch vụ lưu trú**: hotel thú cưng
- **Quản lý đa chi nhánh** (multi-branch)

### 1.2 Quy mô & hiệu năng mục tiêu

| Chỉ số                | Mục tiêu            |
| ---------------------- | -------------------- |
| Hồ sơ thú cưng        | 10,000+              |
| Hồ sơ khách hàng      | 5,000+               |
| Giao dịch / ngày      | 500+                 |
| Chi nhánh              | 1 – 20               |
| Người dùng đồng thời  | 50+                  |
| Thời gian phản hồi API | < 200ms (p95)       |

---

## 2. Công nghệ sử dụng (Tech Stack)

### 2.1 Frontend

| Thành phần    | Công nghệ                        |
| ------------- | --------------------------------- |
| Framework     | **React 18** + TypeScript         |
| UI Library    | **Ant Design 5** (Pro Components) |
| State         | Zustand                           |
| Router        | React Router v6                   |
| HTTP Client   | Axios                             |
| Charts        | Recharts                          |
| Build Tool    | Vite                              |

**Lý do chọn**: Ant Design Pro cung cấp sẵn bộ component cho dashboard, table, form phức tạp — phù hợp hệ thống quản lý. React + TypeScript đảm bảo type-safe và ecosystem lớn.

### 2.2 Backend

| Thành phần    | Công nghệ                       |
| ------------- | -------------------------------- |
| Language      | **TypeScript 5**                 |
| Runtime       | **Node.js 20 LTS**              |
| Framework     | **Express.js** + ts-node         |
| ORM           | **Prisma** (type-safe ORM)       |
| Auth          | JWT (access + refresh token)     |
| Validation    | **Zod** (type-safe validation)   |
| File Upload   | Multer                           |
| Job Queue     | BullMQ (Redis-backed)            |
| Logging       | Winston                          |
| API Docs      | Swagger / OpenAPI 3.0            |

**Lý do chọn**: TypeScript đảm bảo type-safe end-to-end (cả frontend lẫn backend). Prisma cung cấp auto-generated types từ schema, kết hợp Zod cho runtime validation — giảm thiểu lỗi runtime. BullMQ là phiên bản TypeScript-native của Bull.

### 2.3 Database

| Thành phần    | Công nghệ                        |
| ------------- | --------------------------------- |
| RDBMS         | **MySQL 8.0** (MySQL Workbench)   |
| Cache         | Redis 7                           |
| File Storage  | Local disk / S3-compatible        |

### 2.4 DevOps & Tooling

| Thành phần    | Công nghệ              |
| ------------- | ----------------------- |
| Container     | Docker + Docker Compose |
| Reverse Proxy | Nginx                   |
| CI/CD         | GitHub Actions          |
| Testing       | Vitest + Supertest      |

---

## 3. Kiến trúc hệ thống

### 3.1 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)             │
│                   :80 / :443 (SSL)                   │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
    ┌──────▼──────┐       ┌───────▼───────┐
    │  React SPA  │       │  Express API  │
    │  (Vite)     │       │  (TypeScript) │
    │             │       │  :3000        │
    │  /app/*     │       │  /api/v1/*    │
    └─────────────┘       └───┬───────┬───┘
                              │       │
                    ┌─────────▼┐  ┌───▼─────┐
                    │ MySQL 8  │  │  Redis   │
                    │ :3306    │  │  :6379   │
                    └──────────┘  └─────────┘
```

### 3.2 Multi-branch Strategy

Sử dụng **single database, branch_id column** — mọi bảng dữ liệu liên quan đến nghiệp vụ đều có cột `branch_id` để phân tách dữ liệu theo chi nhánh.

- Mỗi user được gán vào 1 hoặc nhiều branch
- Middleware tự động filter theo `branch_id` của user đang đăng nhập
- Admin hệ thống có quyền xem cross-branch

```
branches
├── branch_id (PK)
├── name
├── address
├── phone
├── email
├── is_active
├── created_at
└── updated_at
```

---

## 4. Phân quyền & vai trò (RBAC)

### 4.1 Các vai trò hệ thống

| Vai trò          | Mã             | Mô tả                                           |
| ----------------- | -------------- | ------------------------------------------------ |
| Super Admin       | `super_admin`  | Quản lý toàn hệ thống, cross-branch             |
| Branch Manager    | `branch_mgr`   | Quản lý toàn bộ 1 chi nhánh                     |
| Bác sĩ thú y     | `veterinarian` | Khám bệnh, kê đơn, xem hồ sơ y tế              |
| Lễ tân            | `receptionist` | Tiếp nhận, đặt lịch, thanh toán                 |
| Nhân viên bán hàng| `sales_staff`  | Bán hàng, quản lý kho cơ bản                    |
| Nhân viên grooming| `groomer`      | Xem lịch grooming, cập nhật trạng thái dịch vụ  |
| Kế toán           | `accountant`   | Xem báo cáo tài chính, quản lý thu chi          |

### 4.2 Ma trận phân quyền

Mỗi vai trò được gán tập hợp **permissions** dạng `module:action`:

```
customers:read, customers:write, customers:delete
pets:read, pets:write
products:read, products:write, products:manage_stock
orders:create, orders:read, orders:void
appointments:read, appointments:write, appointments:manage
medical:read, medical:write, medical:prescribe
services:read, services:write
reports:view, reports:export
branches:manage
users:manage
```

---

## 5. Database Schema

### 5.1 Sơ đồ quan hệ tổng quan (ERD Summary)

```
branches ──1:N── users
branches ──1:N── customers
branches ──1:N── products
branches ──1:N── appointments
branches ──1:N── orders

customers ──1:N── pets
pets ──1:N── medical_records
pets ──1:N── vaccinations
pets ──1:N── appointments

appointments ──1:1── invoices
orders ──1:1── invoices
invoices ──1:N── invoice_items
invoices ──1:N── payments

products ──N:1── product_categories
products ──1:N── stock_movements
products ──1:N── order_items

services ──1:N── appointment_services
```

### 5.2 Chi tiết bảng dữ liệu

#### 5.2.1 `branches` — Chi nhánh

```sql
CREATE TABLE branches (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20)  NOT NULL UNIQUE,       -- VD: 'HCM01', 'HN01'
  name          VARCHAR(200) NOT NULL,
  address       TEXT,
  phone         VARCHAR(20),
  email         VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.2 `users` — Người dùng hệ thống

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  phone         VARCHAR(20),
  role          ENUM('super_admin','branch_mgr','veterinarian',
                     'receptionist','sales_staff','groomer','accountant')
                NOT NULL,
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    DATETIME,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role   ON users(role);
```

#### 5.2.3 `customers` — Khách hàng (chủ thú cưng)

```sql
CREATE TABLE customers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  code          VARCHAR(20) NOT NULL UNIQUE,          -- VD: 'KH-000001'
  full_name     VARCHAR(200) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  email         VARCHAR(100),
  address       TEXT,
  date_of_birth DATE,
  gender        ENUM('male','female','other'),
  id_number     VARCHAR(20),                          -- CMND/CCCD
  note          TEXT,
  loyalty_points INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_customers_branch ON customers(branch_id);
CREATE INDEX idx_customers_phone  ON customers(phone);
CREATE INDEX idx_customers_name   ON customers(full_name);
```

#### 5.2.4 `pets` — Thú cưng

```sql
CREATE TABLE pets (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT NOT NULL,
  branch_id     INT NOT NULL,
  code          VARCHAR(20) NOT NULL UNIQUE,          -- VD: 'PET-000001'
  name          VARCHAR(100) NOT NULL,
  species       ENUM('dog','cat','bird','hamster','rabbit','fish','reptile','other')
                NOT NULL,
  breed         VARCHAR(100),
  color         VARCHAR(50),
  gender        ENUM('male','female','unknown') DEFAULT 'unknown',
  date_of_birth DATE,
  weight        DECIMAL(5,2),                         -- kg
  microchip_id  VARCHAR(50),
  photo_url     VARCHAR(500),
  is_neutered   BOOLEAN DEFAULT FALSE,
  allergies     TEXT,
  note          TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id)   REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pets_customer ON pets(customer_id);
CREATE INDEX idx_pets_branch   ON pets(branch_id);
CREATE INDEX idx_pets_species  ON pets(species);
```

#### 5.2.5 `product_categories` — Danh mục sản phẩm

```sql
CREATE TABLE product_categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  parent_id     INT DEFAULT NULL,
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(200) NOT NULL UNIQUE,
  description   TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.6 `products` — Sản phẩm

```sql
CREATE TABLE products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT,
  sku             VARCHAR(50) NOT NULL UNIQUE,
  barcode         VARCHAR(50),
  name            VARCHAR(300) NOT NULL,
  description     TEXT,
  unit            VARCHAR(30) NOT NULL DEFAULT 'cái',  -- cái, hộp, kg, túi, chai...
  cost_price      DECIMAL(12,2) NOT NULL DEFAULT 0,    -- giá nhập
  selling_price   DECIMAL(12,2) NOT NULL DEFAULT 0,    -- giá bán
  is_prescription BOOLEAN DEFAULT FALSE,               -- thuốc kê đơn
  photo_url       VARCHAR(500),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku      ON products(sku);
CREATE INDEX idx_products_barcode  ON products(barcode);
```

#### 5.2.7 `branch_stock` — Tồn kho theo chi nhánh

```sql
CREATE TABLE branch_stock (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  product_id    INT NOT NULL,
  quantity      INT NOT NULL DEFAULT 0,
  min_quantity  INT NOT NULL DEFAULT 5,               -- cảnh báo hết hàng
  max_quantity  INT DEFAULT NULL,
  location      VARCHAR(100),                         -- vị trí kệ
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_product (branch_id, product_id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.8 `stock_movements` — Lịch sử xuất/nhập kho

```sql
CREATE TABLE stock_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  branch_id     INT NOT NULL,
  product_id    INT NOT NULL,
  user_id       INT NOT NULL,
  type          ENUM('import','export','adjustment','transfer','return')
                NOT NULL,
  quantity      INT NOT NULL,                         -- dương = nhập, âm = xuất
  reference_type VARCHAR(50),                         -- 'order', 'transfer', 'manual'
  reference_id  INT,
  note          TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_stock_mv_branch  ON stock_movements(branch_id);
CREATE INDEX idx_stock_mv_product ON stock_movements(product_id);
CREATE INDEX idx_stock_mv_date    ON stock_movements(created_at);
```

#### 5.2.9 `services` — Dịch vụ

```sql
CREATE TABLE services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category      ENUM('medical','grooming','spa','hotel','vaccination','surgery','other')
                NOT NULL,
  code          VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(300) NOT NULL,
  description   TEXT,
  base_price    DECIMAL(12,2) NOT NULL DEFAULT 0,
  duration_min  INT DEFAULT 30,                       -- thời gian ước tính (phút)
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_services_category ON services(category);
```

#### 5.2.10 `appointments` — Lịch hẹn

```sql
CREATE TABLE appointments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  customer_id     INT NOT NULL,
  pet_id          INT NOT NULL,
  assigned_user_id INT,                               -- bác sĩ / groomer phụ trách
  appointment_date DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME,
  type            ENUM('medical','grooming','vaccination','surgery','checkup','hotel')
                  NOT NULL,
  status          ENUM('scheduled','confirmed','in_progress','completed','cancelled','no_show')
                  DEFAULT 'scheduled',
  reason          TEXT,                               -- lý do khám / triệu chứng
  note            TEXT,
  created_by      INT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)        REFERENCES branches(id),
  FOREIGN KEY (customer_id)      REFERENCES customers(id),
  FOREIGN KEY (pet_id)           REFERENCES pets(id),
  FOREIGN KEY (assigned_user_id) REFERENCES users(id),
  FOREIGN KEY (created_by)       REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_appt_branch ON appointments(branch_id);
CREATE INDEX idx_appt_date   ON appointments(appointment_date);
CREATE INDEX idx_appt_pet    ON appointments(pet_id);
CREATE INDEX idx_appt_status ON appointments(status);
```

#### 5.2.11 `appointment_services` — Dịch vụ trong lịch hẹn

```sql
CREATE TABLE appointment_services (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  INT NOT NULL,
  service_id      INT NOT NULL,
  quantity        INT DEFAULT 1,
  unit_price      DECIMAL(12,2) NOT NULL,
  discount        DECIMAL(12,2) DEFAULT 0,
  note            TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (service_id)     REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.12 `medical_records` — Hồ sơ khám bệnh

```sql
CREATE TABLE medical_records (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  INT NOT NULL,
  pet_id          INT NOT NULL,
  vet_id          INT NOT NULL,                       -- bác sĩ khám
  branch_id       INT NOT NULL,
  visit_date      DATETIME NOT NULL,
  weight          DECIMAL(5,2),                       -- cân nặng tại lúc khám
  temperature     DECIMAL(4,1),                       -- nhiệt độ (°C)
  heart_rate      INT,                                -- nhịp tim
  symptoms        TEXT,                               -- triệu chứng
  diagnosis       TEXT,                               -- chẩn đoán
  treatment       TEXT,                               -- phương pháp điều trị
  note            TEXT,
  follow_up_date  DATE,                               -- ngày tái khám
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (pet_id)         REFERENCES pets(id),
  FOREIGN KEY (vet_id)         REFERENCES users(id),
  FOREIGN KEY (branch_id)      REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_medical_pet  ON medical_records(pet_id);
CREATE INDEX idx_medical_date ON medical_records(visit_date);
```

#### 5.2.13 `prescriptions` — Đơn thuốc

```sql
CREATE TABLE prescriptions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  medical_record_id INT NOT NULL,
  product_id        INT NOT NULL,                     -- thuốc (từ bảng products)
  dosage            VARCHAR(200),                     -- liều dùng
  frequency         VARCHAR(100),                     -- tần suất (VD: 2 lần/ngày)
  duration_days     INT,                              -- số ngày dùng
  quantity          INT NOT NULL,
  unit_price        DECIMAL(12,2) NOT NULL,
  note              TEXT,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id),
  FOREIGN KEY (product_id)        REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.14 `vaccinations` — Lịch tiêm phòng

```sql
CREATE TABLE vaccinations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  pet_id          INT NOT NULL,
  branch_id       INT NOT NULL,
  vet_id          INT NOT NULL,
  vaccine_name    VARCHAR(200) NOT NULL,
  vaccine_batch   VARCHAR(100),                       -- số lô vaccine
  vaccination_date DATE NOT NULL,
  next_due_date   DATE,                               -- ngày tiêm tiếp theo
  note            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id)     REFERENCES pets(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (vet_id)     REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_vacc_pet      ON vaccinations(pet_id);
CREATE INDEX idx_vacc_next_due ON vaccinations(next_due_date);
```

#### 5.2.15 `hotel_bookings` — Đặt phòng lưu trú thú cưng

```sql
CREATE TABLE hotel_bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id  INT,
  branch_id       INT NOT NULL,
  pet_id          INT NOT NULL,
  customer_id     INT NOT NULL,
  room_number     VARCHAR(20),
  check_in        DATETIME NOT NULL,
  check_out       DATETIME,
  expected_check_out DATETIME NOT NULL,
  daily_rate      DECIMAL(12,2) NOT NULL,
  status          ENUM('booked','checked_in','checked_out','cancelled')
                  DEFAULT 'booked',
  special_requests TEXT,
  note            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (branch_id)      REFERENCES branches(id),
  FOREIGN KEY (pet_id)         REFERENCES pets(id),
  FOREIGN KEY (customer_id)    REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.16 `invoices` — Hóa đơn

```sql
CREATE TABLE invoices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  branch_id       INT NOT NULL,
  customer_id     INT NOT NULL,
  appointment_id  INT,
  invoice_number  VARCHAR(30) NOT NULL UNIQUE,        -- VD: 'INV-HCM01-20260410-0001'
  type            ENUM('sale','service','mixed') NOT NULL,
  subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) DEFAULT 0,
  tax_amount      DECIMAL(14,2) DEFAULT 0,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0,
  status          ENUM('draft','pending','paid','partial','voided')
                  DEFAULT 'draft',
  note            TEXT,
  created_by      INT NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id)      REFERENCES branches(id),
  FOREIGN KEY (customer_id)    REFERENCES customers(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (created_by)     REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_inv_branch  ON invoices(branch_id);
CREATE INDEX idx_inv_date    ON invoices(created_at);
CREATE INDEX idx_inv_status  ON invoices(status);
CREATE INDEX idx_inv_number  ON invoices(invoice_number);
```

#### 5.2.17 `invoice_items` — Chi tiết hóa đơn

```sql
CREATE TABLE invoice_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id    INT NOT NULL,
  item_type     ENUM('product','service') NOT NULL,
  product_id    INT,
  service_id    INT,
  description   VARCHAR(500),
  quantity      DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price    DECIMAL(12,2) NOT NULL,
  discount      DECIMAL(12,2) DEFAULT 0,
  line_total    DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5.2.18 `payments` — Thanh toán

```sql
CREATE TABLE payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id    INT NOT NULL,
  branch_id     INT NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  method        ENUM('cash','card','transfer','momo','zalopay','vnpay','other')
                NOT NULL,
  reference_no  VARCHAR(100),                         -- mã giao dịch
  paid_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  note          TEXT,
  created_by    INT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (branch_id)  REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pay_invoice ON payments(invoice_id);
CREATE INDEX idx_pay_date    ON payments(paid_at);
```

---

## 6. API Design

### 6.1 Cấu trúc URL

```
Base URL: /api/v1

Auth:
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  GET    /auth/me

Branches:
  GET    /branches
  POST   /branches
  GET    /branches/:id
  PUT    /branches/:id
  DELETE /branches/:id

Users:
  GET    /users
  POST   /users
  GET    /users/:id
  PUT    /users/:id
  PATCH  /users/:id/status

Customers:
  GET    /customers
  POST   /customers
  GET    /customers/:id
  PUT    /customers/:id
  GET    /customers/:id/pets
  GET    /customers/search?q=keyword

Pets:
  GET    /pets
  POST   /pets
  GET    /pets/:id
  PUT    /pets/:id
  GET    /pets/:id/medical-records
  GET    /pets/:id/vaccinations
  GET    /pets/:id/appointments

Products:
  GET    /products
  POST   /products
  GET    /products/:id
  PUT    /products/:id
  GET    /products/categories
  POST   /products/categories

Stock:
  GET    /stock                           -- tồn kho hiện tại
  POST   /stock/import                    -- nhập kho
  POST   /stock/export                    -- xuất kho
  POST   /stock/transfer                  -- chuyển kho giữa chi nhánh
  GET    /stock/movements                 -- lịch sử xuất nhập

Services:
  GET    /services
  POST   /services
  GET    /services/:id
  PUT    /services/:id

Appointments:
  GET    /appointments
  POST   /appointments
  GET    /appointments/:id
  PUT    /appointments/:id
  PATCH  /appointments/:id/status
  GET    /appointments/calendar?from=&to=

Medical Records:
  POST   /medical-records
  GET    /medical-records/:id
  PUT    /medical-records/:id
  POST   /medical-records/:id/prescriptions

Vaccinations:
  POST   /vaccinations
  GET    /vaccinations/:id
  GET    /vaccinations/reminders           -- nhắc lịch tiêm

Hotel:
  GET    /hotel/bookings
  POST   /hotel/bookings
  PATCH  /hotel/bookings/:id/check-in
  PATCH  /hotel/bookings/:id/check-out

Invoices:
  GET    /invoices
  POST   /invoices
  GET    /invoices/:id
  PATCH  /invoices/:id/status
  POST   /invoices/:id/payments
  GET    /invoices/:id/print               -- PDF

Reports:
  GET    /reports/revenue?from=&to=&branch_id=
  GET    /reports/top-products?from=&to=
  GET    /reports/top-services?from=&to=
  GET    /reports/customers?from=&to=
  GET    /reports/appointments?from=&to=
  GET    /reports/stock-alerts
```

### 6.2 Response Format chuẩn

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Số điện thoại không hợp lệ",
    "details": [...]
  }
}
```

### 6.3 Authentication Flow

```
1. Login → POST /auth/login { username, password }
   ← { accessToken (15min), refreshToken (7d) }

2. Mọi request gửi header: Authorization: Bearer <accessToken>

3. Khi accessToken hết hạn → POST /auth/refresh { refreshToken }
   ← { accessToken (mới) }

4. Logout → POST /auth/logout  (xóa refreshToken khỏi Redis)
```

---

## 7. Modules & Tính năng chi tiết

### 7.1 Dashboard

- Tổng quan doanh thu hôm nay / tuần / tháng
- Số lịch hẹn hôm nay (theo trạng thái)
- Cảnh báo tồn kho thấp
- Lịch hẹn sắp tới (5 tiếp theo)
- Biểu đồ doanh thu 7 ngày gần nhất
- Top 5 sản phẩm bán chạy
- Nhắc nhở tiêm phòng sắp đến hạn

### 7.2 Quản lý Khách hàng & Thú cưng

- CRUD khách hàng với tìm kiếm nhanh (tên, SĐT)
- CRUD thú cưng, gắn chủ sở hữu
- Upload ảnh thú cưng
- Xem lịch sử khám, tiêm phòng, mua hàng
- Tích điểm loyalty
- In thẻ khách hàng

### 7.3 Quản lý Lịch hẹn

- Lịch dạng calendar (ngày / tuần / tháng)
- Drag & drop đổi giờ hẹn
- Gán bác sĩ / groomer
- Trạng thái: Đã đặt → Xác nhận → Đang thực hiện → Hoàn thành / Hủy
- Nhắc nhở qua SMS/Email (tích hợp sau)
- Kiểm tra trùng lịch

### 7.4 Khám bệnh & Hồ sơ y tế

- Màn hình khám: thông tin pet, triệu chứng, chẩn đoán, điều trị
- Ghi nhận chỉ số sinh tồn (cân nặng, nhiệt độ, nhịp tim)
- Kê đơn thuốc (chọn từ danh mục sản phẩm)
- Lịch sử khám chi tiết theo pet
- Lịch tái khám
- In phiếu khám, đơn thuốc

### 7.5 Tiêm phòng

- Tra cứu lịch tiêm theo pet
- Ghi nhận tiêm: vaccine, lô, ngày, bác sĩ
- Tự động tính ngày tiêm tiếp theo
- Dashboard nhắc lịch tiêm sắp đến

### 7.6 Dịch vụ Grooming / Spa

- Danh mục dịch vụ + giá
- Đặt lịch grooming qua appointment
- Theo dõi trạng thái (đang chờ → đang làm → xong)
- Ghi chú đặc biệt (da nhạy cảm, cắt kiểu gì...)

### 7.7 Hotel Thú cưng

- Quản lý phòng (trống / đang sử dụng)
- Check-in / Check-out
- Tính phí theo ngày
- Ghi chú yêu cầu đặc biệt (ăn gì, giờ chơi...)

### 7.8 Bán hàng & POS

- Màn hình POS: scan barcode / tìm sản phẩm
- Thêm sản phẩm vào giỏ, điều chỉnh SL
- Áp dụng giảm giá (% hoặc cố định)
- Chọn phương thức thanh toán
- In hóa đơn / xuất PDF
- Trả hàng / hủy hóa đơn

### 7.9 Quản lý Kho

- Xem tồn kho theo chi nhánh
- Nhập kho (từ nhà cung cấp)
- Xuất kho (bán, hư hỏng, điều chỉnh)
- Chuyển kho giữa chi nhánh
- Cảnh báo sản phẩm sắp hết (dưới min_quantity)
- Lịch sử xuất nhập kho

### 7.10 Báo cáo & Thống kê

- Doanh thu theo ngày / tuần / tháng / năm
- Doanh thu theo chi nhánh (so sánh)
- Doanh thu theo loại (sản phẩm vs dịch vụ)
- Top sản phẩm bán chạy
- Top dịch vụ phổ biến
- Thống kê khách hàng mới
- Báo cáo tồn kho
- Xuất Excel / PDF

### 7.11 Cài đặt hệ thống

- Quản lý chi nhánh
- Quản lý user & phân quyền
- Cấu hình thuế VAT
- Cấu hình thông tin in hóa đơn
- Backup database

---

## 8. Cấu trúc thư mục dự án

```
project/
├── client/                          # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # images, fonts
│   │   ├── components/              # shared components
│   │   │   ├── Layout/
│   │   │   ├── Table/
│   │   │   ├── Form/
│   │   │   └── ...
│   │   ├── pages/                   # page components
│   │   │   ├── Dashboard/
│   │   │   ├── Customers/
│   │   │   ├── Pets/
│   │   │   ├── Appointments/
│   │   │   ├── Medical/
│   │   │   ├── Vaccinations/
│   │   │   ├── Grooming/
│   │   │   ├── Hotel/
│   │   │   ├── POS/
│   │   │   ├── Products/
│   │   │   ├── Stock/
│   │   │   ├── Invoices/
│   │   │   ├── Reports/
│   │   │   ├── Settings/
│   │   │   └── Auth/
│   │   ├── hooks/                   # custom hooks
│   │   ├── stores/                  # Zustand stores
│   │   ├── services/                # API call functions
│   │   ├── utils/                   # helpers, formatters
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── routes/                  # route config
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Backend (Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma            # Prisma schema (models & relations)
│   │   ├── migrations/              # Prisma migrations
│   │   └── seed.ts                  # Seed data
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # Prisma client instance
│   │   │   ├── redis.ts
│   │   │   └── app.ts
│   │   ├── types/                   # Shared TypeScript interfaces
│   │   │   ├── express.d.ts         # Express request extension
│   │   │   ├── auth.types.ts
│   │   │   └── common.types.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── pet.routes.ts
│   │   │   └── ...
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   └── ...
│   │   ├── services/                # business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── customer.service.ts
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── branch.middleware.ts  # auto-filter branch_id
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── validators/              # Zod schemas
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── pdf.ts
│   │   │   └── helpers.ts
│   │   ├── jobs/                    # BullMQ jobs
│   │   │   ├── reminder.job.ts
│   │   │   └── report.job.ts
│   │   └── app.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
├── spec.md                          # (this file)
└── README.md
```

---

## 9. Giao diện người dùng (UI/UX)

### 9.1 Layout chính

```
┌──────────────────────────────────────────────────────┐
│  LOGO    Chi nhánh: [HCM01 ▼]    🔔  👤 Nguyễn A  │  ← Header
├────────┬─────────────────────────────────────────────┤
│        │                                             │
│  📊   │           CONTENT AREA                      │
│  👥   │                                             │
│  🐾   │   (Tables, Forms, Calendar, Charts...)      │
│  📅   │                                             │
│  💊   │                                             │
│  ✂️   │                                             │
│  🏨   │                                             │
│  🛒   │                                             │
│  📦   │                                             │
│  📄   │                                             │
│  📈   │                                             │
│  ⚙️   │                                             │
│        │                                             │
├────────┴─────────────────────────────────────────────┤
│  © 2026 Yamagami Pet Clinic                          │  ← Footer
└──────────────────────────────────────────────────────┘
   Sidebar                     Main Content
```

### 9.2 Sidebar Menu

```
Dashboard
Khách hàng
  └─ Danh sách khách hàng
  └─ Thú cưng
Lịch hẹn
  └─ Lịch
  └─ Danh sách hẹn
Y tế
  └─ Khám bệnh
  └─ Tiêm phòng
  └─ Đơn thuốc
Dịch vụ
  └─ Grooming / Spa
  └─ Hotel
Bán hàng (POS)
Sản phẩm
  └─ Danh mục
  └─ Sản phẩm
Kho hàng
  └─ Tồn kho
  └─ Nhập / Xuất kho
Hóa đơn
Báo cáo
Cài đặt
  └─ Chi nhánh
  └─ Người dùng
  └─ Phân quyền
  └─ Hệ thống
```

### 9.3 Nguyên tắc UX

- **Responsive**: hoạt động tốt trên tablet (nhân viên dùng tại quầy)
- **Phím tắt**: F2 (tìm kiếm nhanh), F5 (POS), F9 (thanh toán)
- **Breadcrumb**: luôn hiển thị đường dẫn trang hiện tại
- **Loading states**: skeleton loading cho table, spinner cho actions
- **Confirmation**: mọi hành động xóa / hủy đều có modal xác nhận
- **Toast notifications**: thông báo thành công / lỗi
- **Ngôn ngữ**: tiếng Việt mặc định, hỗ trợ tiếng Anh (i18n)

---

## 10. Bảo mật

| Lớp bảo vệ          | Chi tiết                                          |
| -------------------- | ------------------------------------------------- |
| Password             | bcrypt (salt rounds = 12)                         |
| JWT                  | Access token 15 phút, Refresh token 7 ngày        |
| Rate Limiting        | express-rate-limit — 100 req/min/IP               |
| Input Validation     | Zod validate mọi request body / params             |
| SQL Injection        | Prisma parameterized queries (không raw SQL)       |
| XSS                  | React auto-escape + helmet headers                 |
| CORS                 | Whitelist domain cụ thể                            |
| HTTPS                | Nginx SSL termination                              |
| Branch Isolation     | Middleware enforce branch_id trên mọi query        |
| Audit Log            | Ghi nhận mọi thao tác write (ai, làm gì, lúc nào)|

---

## 11. Kế hoạch triển khai (Phases)

### Phase 1 — Foundation (Tuần 1-3)

- Setup project (Docker, DB, Express + TypeScript, Prisma, React)
- Auth module (login, JWT, RBAC)
- CRUD: branches, users
- Layout + sidebar + routing

### Phase 2 — Core Business (Tuần 4-7)

- CRUD: customers, pets
- Appointments + Calendar
- Medical records + Prescriptions
- Vaccinations

### Phase 3 — Commerce (Tuần 8-10)

- Products + Categories
- Stock management
- POS (Point of Sale)
- Invoices + Payments

### Phase 4 — Services (Tuần 11-12)

- Grooming / Spa module
- Hotel bookings
- Service pricing

### Phase 5 — Intelligence (Tuần 13-14)

- Dashboard analytics
- Reports (revenue, stock, customers)
- Export Excel / PDF
- Stock alerts + Vaccination reminders

### Phase 6 — Polish (Tuần 15-16)

- i18n (Việt / Anh)
- Responsive / tablet optimization
- Performance tuning (Redis cache, query optimization)
- Testing (unit + integration)
- Documentation

---

## 12. Kết nối MySQL Workbench

### 12.1 Cấu hình kết nối

```env
# .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=yamagami_petclinic
DB_USER=root
DB_PASSWORD=your_password
DB_DIALECT=mysql
```

### 12.2 Prisma Config

```prisma
// server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// Models được định nghĩa trong file này
// Prisma tự động generate TypeScript types
```

```typescript
// server/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
```

```env
# .env
DATABASE_URL="mysql://root:your_password@localhost:3306/yamagami_petclinic"
```

### 12.3 Khởi tạo Database

```bash
# Tạo database trong MySQL Workbench hoặc CLI
mysql -u root -p -e "CREATE DATABASE yamagami_petclinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Generate Prisma Client (auto-generate TypeScript types)
npx prisma generate

# Chạy migrations
npx prisma migrate dev --name init

# Chạy seeders (dữ liệu mẫu)
npx ts-node prisma/seed.ts
```

---

## 13. Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: yamagami-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: yamagami_petclinic
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

  redis:
    image: redis:7-alpine
    container_name: yamagami-redis
    restart: always
    ports:
      - "6379:6379"

  server:
    build: ./server
    container_name: yamagami-api
    restart: always
    ports:
      - "3000:3000"
    env_file: ./server/.env
    depends_on:
      - mysql
      - redis

  client:
    build: ./client
    container_name: yamagami-web
    restart: always
    ports:
      - "5173:80"
    depends_on:
      - server

volumes:
  mysql_data:
```

---

*Document generated for Yamagami Project — 2026-04-10*
