import api from './api'
import { SalesReport, VendorStats, ProductSales } from '../types'
import { useAuthStore } from '../store/authStore'

const getVendorId = (): string => {
  const vendorId = useAuthStore.getState().user?.vendorId
  if (!vendorId) {
    throw new Error('Vendor ID not found. Please login again.')
  }
  return vendorId
}

export const analyticsService = {
  async getVendorStats(): Promise<VendorStats> {
    const vendorId = getVendorId()
    const response = await api.get<{ success: boolean; data: VendorStats }>(`/vendor/${vendorId}/stats`)
    return response.data.data
  },

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly'): Promise<SalesReport> {
    // TODO: Backend endpoint not implemented yet - returning mock data
    console.warn('Sales report endpoint not implemented, using mock data')
    return {
      vendorId: getVendorId(),
      period,
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      topProducts: []
    }
  },

  async getTopProducts(limit: number = 10): Promise<ProductSales[]> {
    // TODO: Backend endpoint not implemented yet - returning empty array
    console.warn('Top products endpoint not implemented, using mock data')
    return []
  },

  async exportSalesData(startDate: string, endDate: string): Promise<Blob> {
    // TODO: Backend endpoint not implemented yet
    console.warn('Export sales data endpoint not implemented')
    throw new Error('Export functionality not yet available')
  },
}
