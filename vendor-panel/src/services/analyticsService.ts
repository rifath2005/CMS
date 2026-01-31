import api from './api'
import { SalesReport, VendorStats, ProductSales } from '../types'

export const analyticsService = {
  async getVendorStats(): Promise<VendorStats> {
    const response = await api.get<VendorStats>('/vendor/stats')
    return response.data
  },

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly'): Promise<SalesReport> {
    const response = await api.get<SalesReport>(`/vendor/analytics/sales?period=${period}`)
    return response.data
  },

  async getTopProducts(limit: number = 10): Promise<ProductSales[]> {
    const response = await api.get<ProductSales[]>(`/vendor/analytics/top-products?limit=${limit}`)
    return response.data
  },

  async exportSalesData(startDate: string, endDate: string): Promise<Blob> {
    const response = await api.get('/vendor/analytics/export', {
      params: { startDate, endDate },
      responseType: 'blob',
    })
    return response.data
  },
}
