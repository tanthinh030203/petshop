import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean up ──────────────────────────────────────────────────────────
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
      isActive: true,
    },
  });
  const branchHN = await prisma.branch.create({
    data: {
      code: 'HN01',
      name: 'Chi nhánh Hà Nội',
      address: '456 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
      phone: '024-8765-4321',
      email: 'hn@petshop.vn',
      isActive: true,
    },
  });
  console.log('✅ 2 branches');

  // ── 2. Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123456', 12);
  const usersData = [
    { username: 'admin', email: 'admin@petshop.vn', fullName: 'Quản trị viên hệ thống', role: 'super_admin' as const, phone: '0900-000-001' },
    { username: 'manager_hcm', email: 'manager@petshop.vn', fullName: 'Nguyễn Văn Quản Lý', role: 'branch_mgr' as const, phone: '0900-000-002' },
    { username: 'dr_minh', email: 'drminh@petshop.vn', fullName: 'BS. Trần Văn Minh', role: 'veterinarian' as const, phone: '0900-000-003' },
    { username: 'letan01', email: 'letan@petshop.vn', fullName: 'Lê Thị Hồng', role: 'receptionist' as const, phone: '0900-000-004' },
    { username: 'banhang01', email: 'banhang@petshop.vn', fullName: 'Phạm Văn Bán', role: 'sales_staff' as const, phone: '0900-000-005' },
    { username: 'groomer01', email: 'groomer@petshop.vn', fullName: 'Đỗ Thị Làm Đẹp', role: 'groomer' as const, phone: '0900-000-006' },
    { username: 'ketoan01', email: 'ketoan@petshop.vn', fullName: 'Vũ Thị Kế Toán', role: 'accountant' as const, phone: '0900-000-007' },
  ];
  const users: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: { branchId: branchHCM.id, ...u, passwordHash, isActive: true },
    });
    users.push(user);
  }
  const [admin, manager, drMinh, letan, banhang, groomer, ketoan] = users;
  console.log('✅ 7 users');

  // ── 3. Product Categories ─────────────────────────────────────────────
  const cats = [];
  for (const c of [
    { name: 'Thức ăn', slug: 'thuc-an', sortOrder: 1 },
    { name: 'Phụ kiện', slug: 'phu-kien', sortOrder: 2 },
    { name: 'Thuốc thú y', slug: 'thuoc-thu-y', sortOrder: 3 },
    { name: 'Đồ chơi', slug: 'do-choi', sortOrder: 4 },
    { name: 'Vệ sinh', slug: 've-sinh', sortOrder: 5 },
  ]) {
    cats.push(await prisma.productCategory.create({ data: { ...c, isActive: true } }));
  }
  const [catFood, catAcc, catMed, catToy, catHyg] = cats;
  console.log('✅ 5 product categories');

  // ── 4. Products ───────────────────────────────────────────────────────
  const productsData = [
    { categoryId: catFood.id, sku: 'FOOD-001', name: 'Royal Canin Mini Adult 2kg', unit: 'bao', costPrice: 280000, sellingPrice: 350000 },
    { categoryId: catFood.id, sku: 'FOOD-002', name: 'Pate Whiskas vị cá ngừ 85g', unit: 'gói', costPrice: 12000, sellingPrice: 18000 },
    { categoryId: catFood.id, sku: 'FOOD-003', name: 'Hạt SmartHeart Puppy 1.5kg', unit: 'bao', costPrice: 95000, sellingPrice: 130000 },
    { categoryId: catAcc.id, sku: 'ACC-001', name: 'Vòng cổ da cho chó size M', unit: 'cái', costPrice: 45000, sellingPrice: 75000 },
    { categoryId: catAcc.id, sku: 'ACC-002', name: 'Bát ăn inox chống lật 500ml', unit: 'cái', costPrice: 35000, sellingPrice: 55000 },
    { categoryId: catMed.id, sku: 'MED-001', name: 'Thuốc nhỏ gáy Frontline Plus cho chó', unit: 'tuýp', costPrice: 120000, sellingPrice: 180000, isPrescription: true },
    { categoryId: catMed.id, sku: 'MED-002', name: 'Thuốc tẩy giun Drontal cho mèo', unit: 'viên', costPrice: 50000, sellingPrice: 80000, isPrescription: true },
    { categoryId: catToy.id, sku: 'TOY-001', name: 'Bóng cao su đặc cho chó', unit: 'cái', costPrice: 20000, sellingPrice: 35000 },
    { categoryId: catHyg.id, sku: 'HYG-001', name: 'Sữa tắm SOS cho chó mèo 530ml', unit: 'chai', costPrice: 65000, sellingPrice: 95000 },
    { categoryId: catHyg.id, sku: 'HYG-002', name: "Cát vệ sinh Cat's Best 10L", unit: 'bao', costPrice: 150000, sellingPrice: 210000 },
  ];
  const products: any[] = [];
  for (const p of productsData) {
    products.push(await prisma.product.create({
      data: { ...p, isActive: true, isPrescription: p.isPrescription ?? false },
    }));
  }
  console.log('✅ 10 products');

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
  const services: any[] = [];
  for (const s of servicesData) {
    services.push(await prisma.service.create({ data: { ...s, isActive: true } }));
  }
  const [svcKham, svcChuyenKhoa, svcGrooming, svcSpa, svcDai, svcTongHop, svcTrietSan, svcHotel] = services;
  console.log('✅ 8 services');

  // ── 6. Customers ──────────────────────────────────────────────────────
  const customersData = [
    { code: 'KH-000001', fullName: 'Nguyễn Thị Mai', phone: '0912-345-678', gender: 'female' as const, email: 'mai.nguyen@gmail.com', address: '10 Lê Lợi, Quận 1, TP.HCM' },
    { code: 'KH-000002', fullName: 'Trần Văn Hùng', phone: '0987-654-321', gender: 'male' as const, email: 'hung.tran@gmail.com', address: '25 Hai Bà Trưng, Quận 3, TP.HCM' },
    { code: 'KH-000003', fullName: 'Phạm Thị Lan', phone: '0909-111-222', gender: 'female' as const, email: 'lan.pham@yahoo.com', address: '88 Nguyễn Trãi, Quận 5, TP.HCM' },
    { code: 'KH-000004', fullName: 'Lê Hoàng Nam', phone: '0938-333-444', gender: 'male' as const, email: 'nam.le@outlook.com', address: '15 Cách Mạng Tháng 8, Quận 10, TP.HCM' },
    { code: 'KH-000005', fullName: 'Võ Thị Hạnh', phone: '0976-555-666', gender: 'female' as const, email: 'hanh.vo@gmail.com', address: '200 Điện Biên Phủ, Bình Thạnh, TP.HCM' },
  ];
  const customers: any[] = [];
  for (const c of customersData) {
    customers.push(await prisma.customer.create({
      data: { branchId: branchHCM.id, ...c, isActive: true, loyaltyPoints: Math.floor(Math.random() * 500) },
    }));
  }
  console.log('✅ 5 customers');

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
  const pets: any[] = [];
  for (const p of petsData) {
    pets.push(await prisma.pet.create({
      data: { branchId: branchHCM.id, ...p, isActive: true },
    }));
  }
  console.log('✅ 8 pets');

  // ── 8. Branch Stock ───────────────────────────────────────────────────
  for (const product of products) {
    const qty = Math.floor(Math.random() * 81) + 20;
    await prisma.branchStock.create({
      data: { branchId: branchHCM.id, productId: product.id, quantity: qty, minQuantity: 5, maxQuantity: 200 },
    });
    // Stock movements for initial import
    await prisma.stockMovement.create({
      data: {
        branchId: branchHCM.id, productId: product.id, userId: admin.id,
        type: 'import_stock', quantity: qty, referenceType: 'manual', note: 'Nhập kho ban đầu',
      },
    });
  }
  console.log('✅ Branch stock + stock movements');

  // ── 9. Appointments (today + recent days) ─────────────────────────────
  const today = new Date();
  const d = (daysAgo: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - daysAgo);
    return dt;
  };

  const appointmentsData = [
    // Today
    { customerId: customers[0].id, petId: pets[0].id, assignedUserId: drMinh.id, appointmentDate: d(0), startTime: '09:00', endTime: '09:30', type: 'medical' as const, status: 'scheduled' as const, reason: 'Khám sức khỏe định kỳ', createdBy: letan.id },
    { customerId: customers[1].id, petId: pets[2].id, assignedUserId: groomer.id, appointmentDate: d(0), startTime: '10:00', endTime: '11:00', type: 'grooming' as const, status: 'confirmed' as const, reason: 'Tắm và cắt tỉa lông', createdBy: letan.id },
    { customerId: customers[2].id, petId: pets[4].id, assignedUserId: drMinh.id, appointmentDate: d(0), startTime: '14:00', endTime: '14:30', type: 'vaccination' as const, status: 'scheduled' as const, reason: 'Tiêm phòng dại', createdBy: letan.id },
    { customerId: customers[3].id, petId: pets[6].id, assignedUserId: groomer.id, appointmentDate: d(0), startTime: '15:00', endTime: '16:30', type: 'grooming' as const, status: 'in_progress' as const, reason: 'Spa toàn thân', createdBy: letan.id },
    // Yesterday - completed
    { customerId: customers[0].id, petId: pets[1].id, assignedUserId: drMinh.id, appointmentDate: d(1), startTime: '09:30', endTime: '10:00', type: 'medical' as const, status: 'completed' as const, reason: 'Mèo bỏ ăn 2 ngày', createdBy: letan.id },
    { customerId: customers[4].id, petId: pets[7].id, assignedUserId: drMinh.id, appointmentDate: d(1), startTime: '11:00', endTime: '11:20', type: 'vaccination' as const, status: 'completed' as const, reason: 'Tiêm phòng tổng hợp', createdBy: letan.id },
    // 2 days ago
    { customerId: customers[1].id, petId: pets[3].id, assignedUserId: groomer.id, appointmentDate: d(2), startTime: '14:00', endTime: '15:00', type: 'grooming' as const, status: 'completed' as const, reason: 'Tắm + cắt tỉa', createdBy: letan.id },
    // 3 days ago
    { customerId: customers[2].id, petId: pets[5].id, assignedUserId: drMinh.id, appointmentDate: d(3), startTime: '10:00', endTime: '10:30', type: 'checkup' as const, status: 'completed' as const, reason: 'Tái khám sau điều trị', createdBy: letan.id },
    // 5 days ago - cancelled
    { customerId: customers[3].id, petId: pets[6].id, assignedUserId: drMinh.id, appointmentDate: d(5), startTime: '09:00', endTime: '09:30', type: 'medical' as const, status: 'cancelled' as const, reason: 'Chó bị ho', createdBy: letan.id },
    // Future - tomorrow
    { customerId: customers[4].id, petId: pets[7].id, assignedUserId: groomer.id, appointmentDate: d(-1), startTime: '10:00', endTime: '11:00', type: 'grooming' as const, status: 'scheduled' as const, reason: 'Tắm spa', createdBy: letan.id },
    // Hotel
    { customerId: customers[0].id, petId: pets[0].id, assignedUserId: null, appointmentDate: d(-2), startTime: '08:00', endTime: '18:00', type: 'hotel' as const, status: 'scheduled' as const, reason: 'Gửi lưu trú 3 ngày', createdBy: letan.id },
  ];

  const appointments: any[] = [];
  for (const a of appointmentsData) {
    appointments.push(await prisma.appointment.create({
      data: { branchId: branchHCM.id, ...a },
    }));
  }
  console.log('✅ 11 appointments');

  // ── 10. Appointment Services ──────────────────────────────────────────
  // Medical appointments get medical service
  await prisma.appointmentService.create({ data: { appointmentId: appointments[0].id, serviceId: svcKham.id, quantity: 1, unitPrice: 200000 } });
  await prisma.appointmentService.create({ data: { appointmentId: appointments[4].id, serviceId: svcKham.id, quantity: 1, unitPrice: 200000 } });
  // Grooming appointments
  await prisma.appointmentService.create({ data: { appointmentId: appointments[1].id, serviceId: svcGrooming.id, quantity: 1, unitPrice: 250000 } });
  await prisma.appointmentService.create({ data: { appointmentId: appointments[3].id, serviceId: svcSpa.id, quantity: 1, unitPrice: 400000 } });
  await prisma.appointmentService.create({ data: { appointmentId: appointments[6].id, serviceId: svcGrooming.id, quantity: 1, unitPrice: 250000 } });
  // Vaccination appointments
  await prisma.appointmentService.create({ data: { appointmentId: appointments[2].id, serviceId: svcDai.id, quantity: 1, unitPrice: 150000 } });
  await prisma.appointmentService.create({ data: { appointmentId: appointments[5].id, serviceId: svcTongHop.id, quantity: 1, unitPrice: 300000 } });
  // Checkup
  await prisma.appointmentService.create({ data: { appointmentId: appointments[7].id, serviceId: svcKham.id, quantity: 1, unitPrice: 200000 } });
  console.log('✅ Appointment services');

  // ── 11. Medical Records (for completed appointments) ──────────────────
  const med1 = await prisma.medicalRecord.create({
    data: {
      appointmentId: appointments[4].id, petId: pets[1].id, vetId: drMinh.id, branchId: branchHCM.id,
      visitDate: d(1), weight: 5.1, temperature: 38.5, heartRate: 120,
      symptoms: 'Bỏ ăn 2 ngày, lờ đờ, nôn mửa nhẹ',
      diagnosis: 'Viêm dạ dày nhẹ, nghi do thay đổi thức ăn đột ngột',
      treatment: 'Truyền dịch, thuốc chống nôn, men tiêu hóa. Theo dõi 3 ngày.',
      note: 'Dặn chủ cho ăn cháo loãng 2 ngày đầu',
      followUpDate: d(-2),
    },
  });
  const med2 = await prisma.medicalRecord.create({
    data: {
      appointmentId: appointments[7].id, petId: pets[5].id, vetId: drMinh.id, branchId: branchHCM.id,
      visitDate: d(3), weight: 3.3, temperature: 38.8, heartRate: 140,
      symptoms: 'Tái khám sau điều trị viêm da',
      diagnosis: 'Viêm da đã giảm 80%, lông mọc lại tốt',
      treatment: 'Tiếp tục bôi thuốc thêm 1 tuần',
      note: 'Tình trạng cải thiện tốt',
    },
  });
  console.log('✅ 2 medical records');

  // ── 12. Prescriptions ─────────────────────────────────────────────────
  await prisma.prescription.create({
    data: {
      medicalRecordId: med1.id, productId: products[5].id, // Frontline
      dosage: '1 tuýp/lần', frequency: '1 lần/tháng', durationDays: 30, quantity: 1, unitPrice: 180000,
    },
  });
  await prisma.prescription.create({
    data: {
      medicalRecordId: med1.id, productId: products[6].id, // Drontal
      dosage: '1 viên/5kg', frequency: '1 lần', durationDays: 1, quantity: 2, unitPrice: 80000,
    },
  });
  console.log('✅ 2 prescriptions');

  // ── 13. Vaccinations ──────────────────────────────────────────────────
  const vaccsData = [
    { petId: pets[0].id, vaccineName: 'Vaccine dại Rabisin', vaccineBatch: 'RAB-2026-001', vaccinationDate: d(30), nextDueDate: d(-335) },
    { petId: pets[1].id, vaccineName: 'Vaccine tổng hợp FVRCP', vaccineBatch: 'FVR-2026-012', vaccinationDate: d(60), nextDueDate: d(-305) },
    { petId: pets[2].id, vaccineName: 'Vaccine dại Rabisin', vaccineBatch: 'RAB-2026-002', vaccinationDate: d(90), nextDueDate: d(-275) },
    { petId: pets[2].id, vaccineName: 'Vaccine 7 bệnh cho chó', vaccineBatch: 'DHPPiLR-2026-005', vaccinationDate: d(90), nextDueDate: d(-275) },
    { petId: pets[4].id, vaccineName: 'Vaccine dại Rabisin', vaccineBatch: 'RAB-2025-050', vaccinationDate: d(180), nextDueDate: d(5) }, // Due in 5 days!
    { petId: pets[5].id, vaccineName: 'Vaccine tổng hợp FVRCP', vaccineBatch: 'FVR-2025-030', vaccinationDate: d(200), nextDueDate: d(3) }, // Due in 3 days!
    { petId: pets[6].id, vaccineName: 'Vaccine 7 bệnh cho chó', vaccineBatch: 'DHPPiLR-2025-020', vaccinationDate: d(365), nextDueDate: d(-5) }, // Overdue 5 days!
    { petId: pets[7].id, vaccineName: 'Vaccine tổng hợp FVRCP', vaccineBatch: 'FVR-2026-050', vaccinationDate: d(1), nextDueDate: d(-364) },
  ];
  for (const v of vaccsData) {
    await prisma.vaccination.create({
      data: { ...v, branchId: branchHCM.id, vetId: drMinh.id },
    });
  }
  console.log('✅ 8 vaccinations (with upcoming reminders)');

  // ── 14. Hotel Bookings ────────────────────────────────────────────────
  await prisma.hotelBooking.create({
    data: {
      branchId: branchHCM.id, petId: pets[3].id, customerId: customers[1].id,
      roomNumber: 'P01', checkIn: d(2), checkOut: d(0),
      expectedCheckOut: d(0), dailyRate: 200000, status: 'checked_out',
      specialRequests: 'Cho ăn pate 2 bữa/ngày', note: 'Mèo nhút nhát, cần phòng yên tĩnh',
    },
  });
  await prisma.hotelBooking.create({
    data: {
      branchId: branchHCM.id, petId: pets[6].id, customerId: customers[3].id,
      roomNumber: 'P02', checkIn: d(1), expectedCheckOut: d(-2),
      dailyRate: 250000, status: 'checked_in',
      specialRequests: 'Dắt đi dạo 30 phút/ngày', note: 'Husky cần vận động nhiều',
    },
  });
  await prisma.hotelBooking.create({
    data: {
      branchId: branchHCM.id, petId: pets[0].id, customerId: customers[0].id,
      roomNumber: 'P03', checkIn: d(-2), expectedCheckOut: d(-5),
      dailyRate: 200000, status: 'booked',
      specialRequests: 'Cho ăn hạt Royal Canin',
    },
  });
  console.log('✅ 3 hotel bookings');

  // ── 15. Invoices + Items + Payments ───────────────────────────────────
  // Invoice 1: Service (completed yesterday medical appointment)
  const inv1 = await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[0].id, appointmentId: appointments[4].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(1))}-0001`, type: 'mixed',
      subtotal: 540000, discountAmount: 0, taxAmount: 0, totalAmount: 540000,
      status: 'paid', createdBy: letan.id,
    },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv1.id, itemType: 'service', serviceId: svcKham.id, description: 'Khám tổng quát', quantity: 1, unitPrice: 200000, discount: 0, lineTotal: 200000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv1.id, itemType: 'product', productId: products[5].id, description: 'Thuốc nhỏ gáy Frontline Plus', quantity: 1, unitPrice: 180000, discount: 0, lineTotal: 180000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv1.id, itemType: 'product', productId: products[6].id, description: 'Thuốc tẩy giun Drontal', quantity: 2, unitPrice: 80000, discount: 0, lineTotal: 160000 },
  });
  await prisma.payment.create({
    data: { invoiceId: inv1.id, branchId: branchHCM.id, amount: 540000, method: 'cash', paidAt: d(1), createdBy: letan.id },
  });

  // Invoice 2: Grooming service (2 days ago)
  const inv2 = await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[1].id, appointmentId: appointments[6].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(2))}-0001`, type: 'service',
      subtotal: 250000, discountAmount: 25000, taxAmount: 0, totalAmount: 225000,
      status: 'paid', createdBy: letan.id,
    },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv2.id, itemType: 'service', serviceId: svcGrooming.id, description: 'Tắm + Cắt tỉa lông', quantity: 1, unitPrice: 250000, discount: 25000, lineTotal: 225000 },
  });
  await prisma.payment.create({
    data: { invoiceId: inv2.id, branchId: branchHCM.id, amount: 225000, method: 'transfer', referenceNo: 'MB-20260408-001', paidAt: d(2), createdBy: letan.id },
  });

  // Invoice 3: Vaccination (yesterday, completed)
  const inv3 = await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[4].id, appointmentId: appointments[5].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(1))}-0002`, type: 'service',
      subtotal: 300000, discountAmount: 0, taxAmount: 0, totalAmount: 300000,
      status: 'paid', createdBy: letan.id,
    },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv3.id, itemType: 'service', serviceId: svcTongHop.id, description: 'Tiêm phòng tổng hợp', quantity: 1, unitPrice: 300000, discount: 0, lineTotal: 300000 },
  });
  await prisma.payment.create({
    data: { invoiceId: inv3.id, branchId: branchHCM.id, amount: 300000, method: 'momo', referenceNo: 'MOMO-20260409-123', paidAt: d(1), createdBy: letan.id },
  });

  // Invoice 4: Product sale (3 days ago)
  const inv4 = await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[2].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(3))}-0001`, type: 'sale',
      subtotal: 620000, discountAmount: 0, taxAmount: 0, totalAmount: 620000,
      status: 'paid', createdBy: banhang.id,
    },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv4.id, itemType: 'product', productId: products[0].id, description: 'Royal Canin Mini Adult 2kg', quantity: 1, unitPrice: 350000, discount: 0, lineTotal: 350000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv4.id, itemType: 'product', productId: products[8].id, description: 'Sữa tắm SOS 530ml', quantity: 2, unitPrice: 95000, discount: 0, lineTotal: 190000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv4.id, itemType: 'product', productId: products[3].id, description: 'Vòng cổ da size M', quantity: 1, unitPrice: 75000, discount: 0, lineTotal: 75000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv4.id, itemType: 'product', productId: products[7].id, description: 'Bóng cao su', quantity: 1, unitPrice: 35000, lineTotal: 35000, discount: 30000 },
  });
  await prisma.payment.create({
    data: { invoiceId: inv4.id, branchId: branchHCM.id, amount: 620000, method: 'cash', paidAt: d(3), createdBy: banhang.id },
  });

  // Invoice 5: Partial payment (today, pending)
  const inv5 = await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[3].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(0))}-0001`, type: 'sale',
      subtotal: 480000, discountAmount: 0, taxAmount: 0, totalAmount: 480000,
      status: 'partial', createdBy: banhang.id,
    },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv5.id, itemType: 'product', productId: products[0].id, description: 'Royal Canin Mini Adult 2kg', quantity: 1, unitPrice: 350000, discount: 0, lineTotal: 350000 },
  });
  await prisma.invoiceItem.create({
    data: { invoiceId: inv5.id, itemType: 'product', productId: products[2].id, description: 'Hạt SmartHeart Puppy 1.5kg', quantity: 1, unitPrice: 130000, discount: 0, lineTotal: 130000 },
  });
  await prisma.payment.create({
    data: { invoiceId: inv5.id, branchId: branchHCM.id, amount: 300000, method: 'cash', paidAt: d(0), createdBy: banhang.id },
  });

  // Invoice 6: Draft
  await prisma.invoice.create({
    data: {
      branchId: branchHCM.id, customerId: customers[0].id,
      invoiceNumber: `INV-HCM01-${fmtDate(d(0))}-0002`, type: 'service',
      subtotal: 200000, discountAmount: 0, taxAmount: 0, totalAmount: 200000,
      status: 'draft', createdBy: letan.id,
    },
  });

  console.log('✅ 6 invoices + items + payments');

  // ── 16. Extra stock movements (exports for sold items) ────────────────
  const exportItems = [
    { productId: products[0].id, quantity: -2 },
    { productId: products[5].id, quantity: -1 },
    { productId: products[6].id, quantity: -2 },
    { productId: products[8].id, quantity: -2 },
    { productId: products[3].id, quantity: -1 },
    { productId: products[7].id, quantity: -1 },
    { productId: products[2].id, quantity: -1 },
  ];
  for (const item of exportItems) {
    await prisma.stockMovement.create({
      data: {
        branchId: branchHCM.id, productId: item.productId, userId: banhang.id,
        type: 'export_stock', quantity: item.quantity, referenceType: 'order', note: 'Xuất bán hàng',
      },
    });
  }

  // Make a few products low stock for alerts
  await prisma.branchStock.updateMany({
    where: { productId: products[7].id, branchId: branchHCM.id },
    data: { quantity: 3 }, // Below minQuantity of 5
  });
  await prisma.branchStock.updateMany({
    where: { productId: products[4].id, branchId: branchHCM.id },
    data: { quantity: 2 }, // Below minQuantity of 5
  });
  console.log('✅ Stock movements + low stock alerts');

  console.log('\n🎉 Seeding completed! All modules have sample data.');
  console.log('   Login: admin / 123456');
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
