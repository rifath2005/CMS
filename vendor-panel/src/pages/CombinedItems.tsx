import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { CombinedItem } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { Package, RefreshCw } from 'lucide-react'

const CombinedItems = () => {
    const { socket } = useWebSocket()
    const [items, setItems] = useState<CombinedItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCombinedItems()
    }, [])

    useEffect(() => {
        if (!socket) return

        // Listen for new orders or order updates
        socket.on('newOrder', () => {
            fetchCombinedItems()
        })

        socket.on('orderStatusUpdate', () => {
            fetchCombinedItems()
        })

        return () => {
            socket.off('newOrder')
            socket.off('orderStatusUpdate')
        }
    }, [socket])

    const fetchCombinedItems = async () => {
        try {
            setIsLoading(true)
            const data = await orderService.getCombinedItemList()
            setItems(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load combined items')
        } finally {
            setIsLoading(false)
        }
    }

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
                <div>
                    <h1 className="text-3xl font-bold">Combined Item List</h1>
                    <p className="text-gray-600 mt-1">
                        Total items to prepare: {totalItems}
                    </p>
                </div>
                <button
                    onClick={fetchCombinedItems}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
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

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start space-x-4">
                                    {/* Product Image */}
                                    <img
                                        src={item.imageUrl || '/placeholder-product.png'}
                                        alt={item.productName}
                                        className="w-20 h-20 object-cover rounded-lg"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-product.png'
                                        }}
                                    />

                                    {/* Product Details */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">
                                            {item.productName}
                                        </h3>
                                        <div className="bg-primary-50 rounded-lg p-3 text-center">
                                            <p className="text-3xl font-bold text-primary-600">
                                                {item.totalQuantity}
                                            </p>
                                            <p className="text-sm text-primary-700 font-medium">
                                                {item.totalQuantity === 1 ? 'Unit' : 'Units'} to prepare
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>This list shows the total quantity of each item across all active orders</li>
                            <li>Prepare items in bulk to save time</li>
                            <li>The list updates automatically when new orders arrive</li>
                            <li>Check individual orders for specific customer details</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    )
}

export default CombinedItems
