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
  vendorId?: string
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
  userName: string
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

export interface CombinedItem {
  productId: string
  productName: string
  totalQuantity: number
  imageUrl: string
}

export interface SalesReport {
  vendorId: string
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  topProducts: ProductSales[]
}

export interface ProductSales {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface VendorStats {
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  totalProducts: number
  lowStockProducts: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
  }
}
