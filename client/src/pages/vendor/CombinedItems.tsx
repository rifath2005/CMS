import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../contexts/WebSocketContext'
import api from '../../services/api'

interface CombinedItem {
    productId: string
    productName: string
    totalQuantity: number
    category?: string
}

interface VendorUser {
    id: string
    vendorId?: string
    name: string
}

const CombinedItems = () => {
    const { user } = useAuthStore()
    const { onOrderUpdate } = useWebSocket()
    const [items, setItems] = useState<CombinedItem[]>([])
    const [loading, setLoading] = useState(true)

    const vendorId = (user as VendorUser)?.vendorId || user?.id

    useEffect(() => {
        if (vendorId) {
            fetchCombinedItems()
        }
    }, [vendorId])

    useEffect(() => {
        const cleanup = onOrderUpdate(() => {
            fetchCombinedItems()
        })
        return cleanup
    }, [onOrderUpdate])

    const fetchCombinedItems = async () => {
        if (!vendorId) return

        try {
            setLoading(true)
            const response = await api.get(`/vendor/${vendorId}/combined-items`)
            setItems(response.data.data)
        } catch (error) {
            console.error('Failed to fetch combined items:', error)
        } finally {
            setLoading(false)
        }
    }

    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'OTHER'
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
    }, {} as Record<string, CombinedItem[]>)

    const totalItems = items.reduce((sum, item) => sum + item.totalQuantity, 0)

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Combined Items</h1>
                    <p className="text-gray-600">Aggregated quantities from all active orders</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    🖨️ Print List
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm mb-1">Total Items to Prepare</p>
                        <p className="text-4xl font-bold">{totalItems}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 text-sm mb-1">Unique Products</p>
                        <p className="text-4xl font-bold">{items.length}</p>
                    </div>
                </div>
            </div>

            {/* Items by Category */}
            {items.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 text-lg">No items to prepare</p>
                    <p className="text-gray-400 text-sm mt-2">Items will appear here when orders are placed</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedItems).map(([category, categoryItems]) => (
                        <div key={category} className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-bold text-blue-600 mb-4 uppercase border-b-2 border-blue-600 pb-2">
                                {category}
                            </h2>
                            <div className="space-y-3">
                                {categoryItems.map((item) => (
                                    <div key={item.productId} className="flex items-center justify-between">
                                        <span className="text-gray-700">{item.productName}</span>
                                        <span className="text-2xl font-bold text-blue-600">{item.totalQuantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between font-bold">
                                    <span>Subtotal</span>
                                    <span className="text-blue-600">
                                        {categoryItems.reduce((sum, item) => sum + item.totalQuantity, 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </div>
    )
}

export default CombinedItems
