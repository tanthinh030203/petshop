// ============================================================
// Domain Models
// ============================================================

export interface Branch {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole =
  | 'super_admin'
  | 'branch_mgr'
  | 'veterinarian'
  | 'receptionist'
  | 'sales_staff'
  | 'groomer'
  | 'accountant';

export interface User {
  id: number;
  branch_id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  branch?: Branch;
}

export type Gender = 'male' | 'female' | 'other';

export interface Customer {
  id: number;
  branch_id: number;
  code: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  gender?: Gender;
  id_number?: string;
  note?: string;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch?: Branch;
  pets?: Pet[];
}

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'hamster'
  | 'rabbit'
  | 'fish'
  | 'reptile'
  | 'other';

export type PetGender = 'male' | 'female' | 'unknown';

export interface Pet {
  id: number;
  customer_id: number;
  branch_id: number;
  code: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  color?: string;
  gender: PetGender;
  date_of_birth?: string;
  weight?: number;
  microchip_id?: string;
  photo_url?: string;
  is_neutered: boolean;
  allergies?: string;
  note?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  branch?: Branch;
}

export interface ProductCategory {
  id: number;
  parent_id?: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: ProductCategory[];
}

export interface Product {
  id: number;
  category_id?: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  is_prescription: boolean;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

export interface BranchStock {
  id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
  min_quantity: number;
  max_quantity?: number;
  location?: string;
  updated_at: string;
  branch?: Branch;
  product?: Product;
}

export type ServiceCategory =
  | 'medical'
  | 'grooming'
  | 'spa'
  | 'hotel'
  | 'vaccination'
  | 'surgery'
  | 'other';

export interface Service {
  id: number;
  category: ServiceCategory;
  code: string;
  name: string;
  description?: string;
  base_price: number;
  duration_min: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AppointmentType =
  | 'medical'
  | 'grooming'
  | 'vaccination'
  | 'surgery'
  | 'checkup'
  | 'hotel';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: number;
  branch_id: number;
  customer_id: number;
  pet_id: number;
  assigned_user_id?: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  note?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  branch?: Branch;
  customer?: Customer;
  pet?: Pet;
  assigned_user?: User;
  services?: AppointmentService[];
}

export interface AppointmentService {
  id: number;
  appointment_id: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  note?: string;
  service?: Service;
}

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  pet_id: number;
  vet_id: number;
  branch_id: number;
  visit_date: string;
  weight?: number;
  temperature?: number;
  heart_rate?: number;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  note?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  vet?: User;
  appointment?: Appointment;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: number;
  medical_record_id: number;
  product_id: number;
  dosage?: string;
  frequency?: string;
  duration_days?: number;
  quantity: number;
  unit_price: number;
  note?: string;
  product?: Product;
}

export interface Vaccination {
  id: number;
  pet_id: number;
  branch_id: number;
  vet_id: number;
  vaccine_name: string;
  vaccine_batch?: string;
  vaccination_date: string;
  next_due_date?: string;
  note?: string;
  created_at: string;
  pet?: Pet;
  vet?: User;
}

export type HotelBookingStatus = 'booked' | 'checked_in' | 'checked_out' | 'cancelled';

export interface HotelBooking {
  id: number;
  appointment_id?: number;
  branch_id: number;
  pet_id: number;
  customer_id: number;
  room_number?: string;
  check_in: string;
  check_out?: string;
  expected_check_out: string;
  daily_rate: number;
  status: HotelBookingStatus;
  special_requests?: string;
  note?: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  customer?: Customer;
}

export type InvoiceType = 'sale' | 'service' | 'mixed';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'voided';

export interface Invoice {
  id: number;
  branch_id: number;
  customer_id: number;
  appointment_id?: number;
  invoice_number: string;
  type: InvoiceType;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  note?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export type InvoiceItemType = 'product' | 'service';

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_type: InvoiceItemType;
  product_id?: number;
  service_id?: number;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  product?: Product;
  service?: Service;
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'transfer'
  | 'momo'
  | 'zalopay'
  | 'vnpay'
  | 'other';

export interface Payment {
  id: number;
  invoice_id: number;
  branch_id: number;
  amount: number;
  method: PaymentMethod;
  reference_no?: string;
  paid_at: string;
  note?: string;
  created_by: number;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  branch_id: number;
  branch?: Branch;
}
