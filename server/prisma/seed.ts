import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean up existing data (in reverse dependency order) ──────────────
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.hotelBooking.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.branchStock.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.service.deleteMany();
  await prisma.branch.deleteMany();

  console.log('Cleaned existing data.');

  // ── 1. Branches ───────────────────────────────────────────────────────
  const branchHCM = await prisma.branch.create({
    data: {
      code: 'HCM01',
      name: 'Chi nhánh Hồ Chí Minh',
      address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      phone: '028-1234-5678',
      email: 'hcm@petshop.vn',
    },
  });

  const branchHN = await prisma.branch.create({
    data: {
      code: 'HN01',
      name: 'Chi nhánh Hà Nội',
      address: '456 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      phone: '024-8765-4321',
      email: 'hn@petshop.vn',
    },
  });

  console.log('Created 2 branches.');

  // ── 2. Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123456', 12);

  const usersData = [
    {
      username: 'admin',
      email: 'admin@petshop.vn',
      fullName: 'Quản trị viên hệ thống',
      role: 'super_admin' as const,
      phone: '0900-000-001',
    },
    {
      username: 'manager_hcm',
      email: 'manager@petshop.vn',
      fullName: 'Nguyễn Văn Quản Lý',
      role: 'branch_mgr' as const,
      phone: '0900-000-002',
    },
    {
      username: 'dr_minh',
      email: 'drminh@petshop.vn',
      fullName: 'BS. Trần Văn Minh',
      role: 'veterinarian' as const,
      phone: '0900-000-003',
    },
    {
      username: 'letan01',
      email: 'letan@petshop.vn',
      fullName: 'Lê Thị Hồng',
      role: 'receptionist' as const,
      phone: '0900-000-004',
    },
    {
      username: 'banhang01',
      email: 'banhang@petshop.vn',
      fullName: 'Phạm Văn Bán',
      role: 'sales_staff' as const,
      phone: '0900-000-005',
    },
    {
      username: 'groomer01',
      email: 'groomer@petshop.vn',
      fullName: 'Đỗ Thị Làm Đẹp',
      role: 'groomer' as const,
      phone: '0900-000-006',
    },
    {
      username: 'ketoan01',
      email: 'ketoan@petshop.vn',
      fullName: 'Vũ Thị Kế Toán',
      role: 'accountant' as const,
      phone: '0900-000-007',
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        branchId: branchHCM.id,
        username: u.username,
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
      },
    });
    users.push(user);
  }

  console.log('Created 7 users.');

  // ── 3. Product Categories ─────────────────────────────────────────────
  const categoriesData = [
    { name: 'Thức ăn', slug: 'thuc-an', sortOrder: 1 },
    { name: 'Phụ kiện', slug: 'phu-kien', sortOrder: 2 },
    { name: 'Thuốc thú y', slug: 'thuoc-thu-y', sortOrder: 3 },
    { name: 'Đồ chơi', slug: 'do-choi', sortOrder: 4 },
    { name: 'Vệ sinh', slug: 've-sinh', sortOrder: 5 },
  ];

  const categories = [];
  for (const c of categoriesData) {
    const cat = await prisma.productCategory.create({ data: c });
    categories.push(cat);
  }

  console.log('Created 5 product categories.');

  // ── 4. Products ───────────────────────────────────────────────────────
  const [catFood, catAccessory, catMedicine, catToy, catHygiene] = categories;

  const productsData = [
    // Thức ăn
    {
      categoryId: catFood.id,
      sku: 'FOOD-001',
      name: 'Royal Canin Mini Adult 2kg',
      unit: 'bao',
      costPrice: 280000,
      sellingPrice: 350000,
    },
    {
      categoryId: catFood.id,
      sku: 'FOOD-002',
      name: 'Pate Whiskas vị cá ngừ 85g',
      unit: 'gói',
      costPrice: 12000,
      sellingPrice: 18000,
    },
    {
      categoryId: catFood.id,
      sku: 'FOOD-003',
      name: 'Hạt SmartHeart Puppy 1.5kg',
      unit: 'bao',
      costPrice: 95000,
      sellingPrice: 130000,
    },
    // Phụ kiện
    {
      categoryId: catAccessory.id,
      sku: 'ACC-001',
      name: 'Vòng cổ da cho chó size M',
      unit: 'cái',
      costPrice: 45000,
      sellingPrice: 75000,
    },
    {
      categoryId: catAccessory.id,
      sku: 'ACC-002',
      name: 'Bát ăn inox chống lật 500ml',
      unit: 'cái',
      costPrice: 35000,
      sellingPrice: 55000,
    },
    // Thuốc thú y
    {
      categoryId: catMedicine.id,
      sku: 'MED-001',
      name: 'Thuốc nhỏ gáy Frontline Plus cho chó',
      unit: 'tuýp',
      costPrice: 120000,
      sellingPrice: 180000,
      isPrescription: true,
    },
    {
      categoryId: catMedicine.id,
      sku: 'MED-002',
      name: 'Thuốc tẩy giun Drontal cho mèo',
      unit: 'viên',
      costPrice: 50000,
      sellingPrice: 80000,
      isPrescription: true,
    },
    // Đồ chơi
    {
      categoryId: catToy.id,
      sku: 'TOY-001',
      name: 'Bóng cao su đặc cho chó',
      unit: 'cái',
      costPrice: 20000,
      sellingPrice: 35000,
    },
    // Vệ sinh
    {
      categoryId: catHygiene.id,
      sku: 'HYG-001',
      name: 'Sữa tắm SOS cho chó mèo 530ml',
      unit: 'chai',
      costPrice: 65000,
      sellingPrice: 95000,
    },
    {
      categoryId: catHygiene.id,
      sku: 'HYG-002',
      name: 'Cát vệ sinh Cat\'s Best 10L',
      unit: 'bao',
      costPrice: 150000,
      sellingPrice: 210000,
    },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        categoryId: p.categoryId,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        isPrescription: p.isPrescription ?? false,
      },
    });
    products.push(product);
  }

  console.log('Created 10 products.');

  // ── 5. Services ───────────────────────────────────────────────────────
  const servicesData = [
    { category: 'medical' as const, code: 'SVC-MED01', name: 'Khám tổng quát', basePrice: 200000, durationMin: 30 },
    { category: 'medical' as const, code: 'SVC-MED02', name: 'Khám chuyên khoa', basePrice: 350000, durationMin: 45 },
    { category: 'grooming' as const, code: 'SVC-GRM01', name: 'Tắm + Cắt tỉa lông', basePrice: 250000, durationMin: 60 },
    { category: 'spa' as const, code: 'SVC-GRM02', name: 'Spa toàn thân', basePrice: 400000, durationMin: 90 },
    { category: 'vaccination' as const, code: 'SVC-VAC01', name: 'Tiêm phòng dại', basePrice: 150000, durationMin: 15 },
    { category: 'vaccination' as const, code: 'SVC-VAC02', name: 'Tiêm phòng tổng hợp', basePrice: 300000, durationMin: 20 },
    { category: 'surgery' as const, code: 'SVC-SUR01', name: 'Triệt sản', basePrice: 1500000, durationMin: 120 },
    { category: 'hotel' as const, code: 'SVC-HTL01', name: 'Lưu trú qua đêm', basePrice: 200000, durationMin: 1440 },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }

  console.log('Created 8 services.');

  // ── 6. Customers ──────────────────────────────────────────────────────
  const customersData = [
    { code: 'KH-000001', fullName: 'Nguyễn Thị Mai', phone: '0912-345-678', gender: 'female' as const, email: 'mai.nguyen@gmail.com', address: '10 Lê Lợi, Quận 1, TP.HCM' },
    { code: 'KH-000002', fullName: 'Trần Văn Hùng', phone: '0987-654-321', gender: 'male' as const, email: 'hung.tran@gmail.com', address: '25 Hai Bà Trưng, Quận 3, TP.HCM' },
    { code: 'KH-000003', fullName: 'Phạm Thị Lan', phone: '0909-111-222', gender: 'female' as const, email: 'lan.pham@yahoo.com', address: '88 Nguyễn Trãi, Quận 5, TP.HCM' },
    { code: 'KH-000004', fullName: 'Lê Hoàng Nam', phone: '0938-333-444', gender: 'male' as const, email: 'nam.le@outlook.com', address: '15 Cách Mạng Tháng 8, Quận 10, TP.HCM' },
    { code: 'KH-000005', fullName: 'Võ Thị Hạnh', phone: '0976-555-666', gender: 'female' as const, email: 'hanh.vo@gmail.com', address: '200 Điện Biên Phủ, Bình Thạnh, TP.HCM' },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: {
        branchId: branchHCM.id,
        ...c,
      },
    });
    customers.push(customer);
  }

  console.log('Created 5 customers.');

  // ── 7. Pets ───────────────────────────────────────────────────────────
  const petsData = [
    { code: 'PET-000001', customerId: customers[0].id, name: 'Bông', species: 'dog' as const, breed: 'Poodle', color: 'Trắng', gender: 'female' as const, weight: 4.5, dateOfBirth: new Date('2022-03-15') },
    { code: 'PET-000002', customerId: customers[0].id, name: 'Miu', species: 'cat' as const, breed: 'Mèo Anh lông ngắn', color: 'Xám xanh', gender: 'male' as const, weight: 5.2, dateOfBirth: new Date('2021-08-20') },
    { code: 'PET-000003', customerId: customers[1].id, name: 'Rocky', species: 'dog' as const, breed: 'Golden Retriever', color: 'Vàng', gender: 'male' as const, weight: 28.0, dateOfBirth: new Date('2020-12-01') },
    { code: 'PET-000004', customerId: customers[1].id, name: 'Mèo Mập', species: 'cat' as const, breed: 'Mèo Ba Tư', color: 'Trắng kem', gender: 'female' as const, weight: 4.8, dateOfBirth: new Date('2023-01-10') },
    { code: 'PET-000005', customerId: customers[2].id, name: 'Lucky', species: 'dog' as const, breed: 'Corgi', color: 'Vàng trắng', gender: 'male' as const, weight: 12.5, dateOfBirth: new Date('2021-06-05') },
    { code: 'PET-000006', customerId: customers[2].id, name: 'Kitty', species: 'cat' as const, breed: 'Mèo Munchkin', color: 'Vàng', gender: 'female' as const, weight: 3.2, dateOfBirth: new Date('2022-11-18') },
    { code: 'PET-000007', customerId: customers[3].id, name: 'Max', species: 'dog' as const, breed: 'Husky Siberia', color: 'Đen trắng', gender: 'male' as const, weight: 22.0, dateOfBirth: new Date('2021-04-22') },
    { code: 'PET-000008', customerId: customers[4].id, name: 'Mimi', species: 'cat' as const, breed: 'Mèo Scottish Fold', color: 'Xám', gender: 'female' as const, weight: 3.8, dateOfBirth: new Date('2023-05-30') },
  ];

  for (const p of petsData) {
    await prisma.pet.create({
      data: {
        branchId: branchHCM.id,
        customerId: p.customerId,
        code: p.code,
        name: p.name,
        species: p.species,
        breed: p.breed,
        color: p.color,
        gender: p.gender,
        weight: p.weight,
        dateOfBirth: p.dateOfBirth,
      },
    });
  }

  console.log('Created 8 pets.');

  // ── 8. Branch Stock (HCM01) ───────────────────────────────────────────
  for (const product of products) {
    const quantity = Math.floor(Math.random() * 81) + 20; // 20–100
    await prisma.branchStock.create({
      data: {
        branchId: branchHCM.id,
        productId: product.id,
        quantity,
        minQuantity: 5,
        maxQuantity: 200,
      },
    });
  }

  console.log('Created initial branch stock for 10 products at HCM01.');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
