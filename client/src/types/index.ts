export enum UserRole {
  MAIN_ADMIN = 'MAIN_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  VENDOR = 'VENDOR',
  USER = 'USER',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  institutionId: string
  createdAt: string
}

export interface AuthToken {
  token: string
  user: User
}

export interface Product {
  id: string
  vendorId: string
  name: string
  description: string
  price: number
  category: string
  stockQuantity: number
  imageUrl: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  productId: string
  productName: string
  quantity: number
  price: number
  imageUrl: string
  vendorId: string
  canteenId: string
  canteenName: string
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED',
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  imageUrl: string
}

export interface Order {
  id: string
  userId: string
  userName?: string // Customer name from backend
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  paymentId: string
  status: OrderStatus
  billGeneratedAt: string
  billExpiresAt: string
  deliveredAt?: string
  createdAt: string
}

export interface DigitalBill {
  id: string
  orderId: string
  userId: string
  userName: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  paymentTimestamp: string
  generatedAt: string
  expiresAt: string
  remainingSeconds: number
  isValid: boolean
  isDelivered: boolean
  qrCode: string
  validationToken: string
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Payment {
  id: string
  userId: string
  amount: number
  status: PaymentStatus
  upiTransactionId: string
  createdAt: string
  completedAt?: string
}

export interface UserStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  activeOrdersCount: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
  }
}
