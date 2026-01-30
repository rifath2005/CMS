// User Types
export enum UserRole {
  MAIN_ADMIN = 'MAIN_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  VENDOR = 'VENDOR',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  token: string;
  expiresIn: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

// Institution Types
export interface Institution {
  id: string;
  name: string;
  emailDomain: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
}

// Canteen Types
export interface Canteen {
  id: string;
  institutionId: string;
  vendorId: string;
  name: string;
  location?: string;
  operatingHours?: OperatingHours;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export interface OperatingHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

// Product Types
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  stockQuantity: number;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
}

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  totalAmount: number;
  paymentId: string;
  status: OrderStatus;
  billGeneratedAt: Date;
  billExpiresAt: Date;
  qrCode: string;
  validationToken: string;
  isQrScanned: boolean;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface CombinedItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  imageUrl?: string;
}

// Payment Types
export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  upiTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentIntent {
  paymentId: string;
  amount: number;
  gatewayUrl: string;
  transactionId: string;
}

// Digital Bill Types
export interface DigitalBill {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentTimestamp: Date;
  generatedAt: Date;
  expiresAt: Date;
  remainingSeconds: number;
  isValid: boolean;
  isDelivered: boolean;
  qrCode: string;
  validationToken: string;
}

export interface QRVerificationResult {
  isValid: boolean;
  billId?: string;
  orderId?: string;
  errorMessage?: string;
}

// Analytics Types
export enum TimePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface SalesReport {
  vendorId: string;
  period: TimePeriod;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: ProductSales[];
}

export interface ProductSales {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  startDate: Date;
  endDate: Date;
}

export interface VolumeTrend {
  date: string;
  orderCount: number;
}

export enum ExportFormat {
  CSV = 'CSV',
  JSON = 'JSON',
}

// WebSocket Types
export interface OrderUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: Date;
}

export interface Notification {
  type: string;
  message: string;
  data?: any;
  timestamp: Date;
}

// Statistics Types
export interface InstitutionStats {
  institutionId: string;
  totalUsers: number;
  totalCanteens: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface UserStats {
  userId: string;
  totalOrders: number;
  totalSpending: number;
  activeOrders: number;
}

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: Date;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Session Types
export interface SessionData {
  token: string;
  role: UserRole;
  institutionId: string;
  expiresAt: Date;
}
