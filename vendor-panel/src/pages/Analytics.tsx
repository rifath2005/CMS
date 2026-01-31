import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import { SalesReport, VendorStats, ProductSales } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { TrendingUp, DollarSign, ShoppingBag, Package, Download, Award } from 'lucide-react'

const Analytics = () => {
    const [stats, setStats] = useState<VendorStats | null>(null)
    const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
    const [topProducts, setTopProducts] = useState<ProductSales[]>([])
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        fetchAnalytics()
    }, [period])

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true)
            const [statsData, reportData, productsData] = await Promise.all([
                analyticsService.getVendorStats(),
                analyticsService.getSalesReport(period),
                analyticsService.getTopProducts(5),
            ])
            setStats(statsData)
            setSalesReport(reportData)
            setTopProducts(productsData)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load analytics')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const endDate = new Date().toISOString().split('T')[0]
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            const blob = await analyticsService.exportSalesData(startDate, endDate)
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `sales-report-${startDate}-to-${endDate}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to export data')
        } finally {
            setIsExporting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center disabled:opacity-50"
                >
                    {isExporting ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" />
                            Export CSV
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
                            <DollarSign className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-1">All time</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                            <ShoppingBag className="w-8 h-8 text-primary-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                        <p className="text-sm text-gray-500 mt-1">All time</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Active Orders</h3>
                            <TrendingUp className="w-8 h-8 text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
                        <p className="text-sm text-gray-500 mt-1">In progress</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
                            <Package className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {stats.lowStockProducts > 0 && (
                                <span className="text-yellow-600">{stats.lowStockProducts} low stock</span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Period Selector */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Period:</span>
                    <div className="flex space-x-2">
                        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sales Report */}
            {salesReport && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Sales Report ({period})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-primary-600">
                                ₹{salesReport.totalRevenue.toFixed(2)}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-primary-600">
                                {salesReport.totalOrders}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                            <p className="text-2xl font-bold text-primary-600">
                                ₹{salesReport.averageOrderValue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                    <Award className="w-6 h-6 text-yellow-500 mr-2" />
                    <h2 className="text-xl font-bold">Top Selling Products</h2>
                </div>

                {topProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No sales data available</p>
                ) : (
                    <div className="space-y-4">
                        {topProducts.map((product, index) => (
                            <div
                                key={product.productId}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-600 rounded-full font-bold">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{product.productName}</h3>
                                        <p className="text-sm text-gray-600">
                                            {product.quantitySold} units sold
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary-600">
                                        ₹{product.revenue.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">Revenue</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Analytics
