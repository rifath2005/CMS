import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { CombinedItem } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { Package, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

const CombinedItems = () => {
    const { socket } = useWebSocket()
    const [items, setItems] = useState<CombinedItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        fetchCombinedItems()
    }, [])

    useEffect(() => {
        if (!socket) return

        // Listen for new orders or order updates
        socket.on('newOrder', () => {
            handleAutoRefresh()
        })

        socket.on('orderStatusUpdate', () => {
            handleAutoRefresh()
        })

        return () => {
            socket.off('newOrder')
            socket.off('orderStatusUpdate')
        }
    }, [socket])

    const handleAutoRefresh = async () => {
        setIsRefreshing(true)
        await fetchCombinedItems(false)
        // Keep the pulse indicator visible for a moment
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    const fetchCombinedItems = async (showLoading = true) => {
        try {
            if (showLoading) {
                setIsLoading(true)
            }
            const data = await orderService.getCombinedItemList()
            setItems(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load combined items')
        } finally {
            if (showLoading) {
                setIsLoading(false)
            }
        }
    }

    const handleManualRefresh = async () => {
        setIsRefreshing(true)
        await fetchCombinedItems(false)
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized'
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(item)
        return acc
    }, {} as Record<string, CombinedItem[]>)

    const categories = Object.keys(groupedItems).sort()
    const totalItems = items.reduce((sum, item) => sum + item.totalQuantity, 0)

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
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Combined Item List</h1>
                        <p className="text-gray-600 mt-1">
                            Total items to prepare: {totalItems}
                        </p>
                    </div>
                    {/* Auto-refresh pulse indicator */}
                    {isRefreshing && (
                        <div className="flex items-center gap-2 text-sm text-primary-600 animate-pulse">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                            </span>
                            <span className="font-medium">Updating...</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className={clsx(
                        "bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center min-h-[44px] min-w-[44px]",
                        isRefreshing ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-700"
                    )}
                >
                    <RefreshCw className={clsx("w-5 h-5 mr-2", isRefreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {items.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No items to prepare</h2>
                    <p className="text-gray-500">Items from active orders will appear here</p>
                </div>
            ) : (
                <>
                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Preparation Summary</h2>
                                <p className="text-primary-100">
                                    {items.length} unique {items.length === 1 ? 'item' : 'items'} across all active orders
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-bold">{totalItems}</p>
                                <p className="text-primary-100">Total Quantity</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Grouped by Category */}
                    <div className="space-y-8">
                        {categories.map((category) => (
                            <div key={category}>
                                {/* Category Header - Sticky */}
                                <div className="sticky top-0 z-10 bg-gray-100 border-b-2 border-gray-300 px-4 py-3 mb-4 rounded-t-lg">
                                    <h2 className="text-xl font-bold text-gray-800">{category}</h2>
                                    <p className="text-sm text-gray-600">
                                        {groupedItems[category].reduce((sum, item) => sum + item.totalQuantity, 0)} items
                                    </p>
                                </div>

                                {/* Items Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                    {groupedItems[category].map((item) => (
                                        <div
                                            key={item.productId}
                                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
                                        >
                                            <div className="flex items-start space-x-4">
                                                {/* Product Image */}
                                                <img
                                                    src={item.imageUrl || '/placeholder-product.png'}
                                                    alt={item.productName}
                                                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder-product.png'
                                                    }}
                                                />

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg mb-3 text-gray-900 line-clamp-2">
                                                        {item.productName}
                                                    </h3>
                                                    {/* Quantity with Visual Dominance */}
                                                    <div className="bg-primary-50 rounded-lg p-4 text-center border-2 border-primary-200">
                                                        <p className="text-5xl font-bold text-primary-600 leading-none mb-1">
                                                            {item.totalQuantity}
                                                        </p>
                                                        <p className="text-sm text-primary-700 font-semibold uppercase tracking-wide">
                                                            {item.totalQuantity === 1 ? 'Unit' : 'Units'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Items are grouped by category for easier preparation</li>
                            <li>Quantities are displayed prominently to help with bulk preparation</li>
                            <li>The list updates automatically when new orders arrive (watch for the pulse indicator)</li>
                            <li>Check individual orders for specific customer details</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    )
}

export default CombinedItems
