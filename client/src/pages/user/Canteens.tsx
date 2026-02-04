import { useState, useEffect, useMemo, useCallback } from 'react'
import { canteenService, Canteen } from '../../services/canteenService'
import { productService } from '../../services/productService'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { Product } from '../../types'
import ErrorAlert from '../../components/ErrorAlert'
import { ArrowLeft, Store } from 'lucide-react'

const Canteens = () => {
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCanteenChangeDialog, setShowCanteenChangeDialog] = useState(false)
    const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

    const { addItem, items: cartItems, clearCart, getCanteenId, getCanteenName } = useCartStore()
    const { user } = useAuthStore()

    useEffect(() => {
        loadCanteens()
    }, [])

    const loadCanteens = async () => {
        if (!user?.institutionId) {
            setError('User institution not found')
            setInitialLoading(false)
            return
        }

        try {
            setError(null)
            const data = await canteenService.getCanteensByInstitution(user.institutionId)
            const activeCanteens = data.filter(c => c.isActive && c.isApproved)
            setCanteens(activeCanteens)
            setInitialLoading(false)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load canteens')
            setInitialLoading(false)
        }
    }

    const loadProductsByCanteen = useCallback(async (canteen: Canteen) => {
        // Immediately show the selected canteen with loading state
        setSelectedCanteen(canteen)
        setLoading(true)
        setError(null)
        
        try {
            const data = await productService.getProductsByVendor(canteen.vendorId, true)
            setProducts(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load products')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleBackToCanteens = useCallback(() => {
        setSelectedCanteen(null)
        setProducts([])
        setSearchQuery('')
    }, [])

    const handleAddToCart = useCallback((product: Product) => {
        if (!product.isAvailable || product.stockQuantity === 0 || !selectedCanteen) return

        const currentCanteenId = getCanteenId()
        
        // Check if cart has items from a different canteen
        if (currentCanteenId && currentCanteenId !== selectedCanteen.id) {
            setPendingProduct(product)
            setShowCanteenChangeDialog(true)
            return
        }

        // Add to cart
        addItem({
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price,
            imageUrl: product.imageUrl,
            vendorId: product.vendorId,
            canteenId: selectedCanteen.id,
            canteenName: selectedCanteen.name,
        })
    }, [addItem, selectedCanteen, getCanteenId])

    const handleConfirmCanteenChange = useCallback(() => {
        if (!pendingProduct || !selectedCanteen) return

        // Clear cart and add new product
        clearCart()
        addItem({
            productId: pendingProduct.id,
            productName: pendingProduct.name,
            quantity: 1,
            price: pendingProduct.price,
            imageUrl: pendingProduct.imageUrl,
            vendorId: pendingProduct.vendorId,
            canteenId: selectedCanteen.id,
            canteenName: selectedCanteen.name,
        })

        setShowCanteenChangeDialog(false)
        setPendingProduct(null)
    }, [pendingProduct, selectedCanteen, clearCart, addItem])

    const handleCancelCanteenChange = useCallback(() => {
        setShowCanteenChangeDialog(false)
        setPendingProduct(null)
    }, [])

    const isInCart = useCallback((productId: string) => {
        return cartItems.some(item => item.productId === productId)
    }, [cartItems])

    const getCartQuantity = useCallback((productId: string) => {
        const item = cartItems.find(item => item.productId === productId)
        return item?.quantity || 0
    }, [cartItems])

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products
        const query = searchQuery.toLowerCase()
        return products.filter(product =>
            product.name.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query)
        )
    }, [products, searchQuery])

    const filteredCanteens = useMemo(() => {
        if (!searchQuery) return canteens
        const query = searchQuery.toLowerCase()
        return canteens.filter(canteen =>
            canteen.name.toLowerCase().includes(query) ||
            canteen.location.toLowerCase().includes(query)
        )
    }, [canteens, searchQuery])

    const isOutOfStock = useCallback((product: Product) => {
        return !product.isAvailable || product.stockQuantity === 0
    }, [])

    // Render Products View
    if (selectedCanteen) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="pb-8">
                    {/* Header with Back Button */}
                    <div className="mb-6">
                    <button
                        onClick={handleBackToCanteens}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-base"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Canteens
                    </button>
                    <h1 className="text-3xl font-bold mb-2">{selectedCanteen.name}</h1>
                    <p className="text-gray-600">{selectedCanteen.location}</p>
                </div>

                {error && (
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                )}

                {/* Canteen Change Confirmation Dialog */}
                {showCanteenChangeDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Canteen?</h3>
                            <p className="text-gray-600 mb-2">
                                Your cart contains items from <span className="font-semibold">{getCanteenName()}</span>.
                            </p>
                            <p className="text-gray-600 mb-6">
                                Adding items from <span className="font-semibold">{selectedCanteen?.name}</span> will clear your current cart.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleCancelCanteenChange}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmCanteenChange}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                                >
                                    Clear Cart & Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-base"
                        aria-label="Search products"
                    />
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4">
                                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="flex justify-between mb-3">
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="h-11 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {searchQuery
                                ? 'No products found matching your search'
                                : 'No products available in this canteen'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => {
                            const outOfStock = isOutOfStock(product)

                            return (
                                <div
                                    key={product.id}
                                    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-base hover-elevate ${outOfStock ? 'opacity-60' : ''
                                        }`}
                                >
                                    {/* Product Image */}
                                    <div className="relative h-48 bg-gray-200">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                loading="lazy"
                                                className={`w-full h-full object-cover ${outOfStock ? 'grayscale' : ''}`}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Out of Stock Overlay */}
                                        {outOfStock && (
                                            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                                                <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                    Out of Stock
                                                </div>
                                            </div>
                                        )}

                                        {!outOfStock && product.stockQuantity < 10 && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                Low Stock
                                            </div>
                                        )}

                                        <div className="absolute top-2 left-2">
                                            <span className="bg-white bg-opacity-90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className={`text-lg font-semibold mb-2 line-clamp-1 ${outOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {product.name}
                                        </h3>
                                        <p className={`text-sm mb-3 line-clamp-2 ${outOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {product.description}
                                        </p>

                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-2xl font-bold ${outOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
                                                ₹{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                Stock: {product.stockQuantity}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={outOfStock}
                                            className={`w-full h-11 px-4 rounded-lg font-semibold ${outOfStock
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : isInCart(product.id)
                                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                            aria-label={outOfStock ? 'Product out of stock' : isInCart(product.id) ? `${product.name} in cart` : `Add ${product.name} to cart`}
                                        >
                                            {outOfStock
                                                ? 'Out of Stock'
                                                : isInCart(product.id)
                                                    ? `In Cart (${getCartQuantity(product.id)})`
                                                    : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                </div>
            </div>
        )
    }

    // Render Canteens View
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="pb-8">
                {/* Header */}
                <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Canteens</h1>
                <p className="text-gray-600">Browse canteens in your institution</p>
            </div>

                {error && (
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                )}

                {/* Search Bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search canteens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                        aria-label="Search canteens"
                    />
                </div>

                {/* Canteens Grid with Skeleton Loading */}
                {initialLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                                <div className="p-4">
                                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                                    <div className="h-11 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredCanteens.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {searchQuery
                                ? 'No canteens found matching your search'
                                : 'No canteens available'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCanteens.map(canteen => (
                            <div
                                key={canteen.id}
                                onClick={() => loadProductsByCanteen(canteen)}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg cursor-pointer"
                            >
                                {/* Canteen Image Placeholder */}
                                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-600">
                                    <div className="w-full h-full flex items-center justify-center text-white">
                                        <Store className="w-20 h-20 opacity-80" />
                                    </div>
                                </div>

                                {/* Canteen Details */}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-gray-900">
                                        {canteen.name}
                                    </h3>
                                    <p className="text-sm mb-3 line-clamp-2 text-gray-600">
                                        {canteen.location}
                                    </p>

                                    {canteen.operatingHours && (
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-gray-500">
                                                {canteen.operatingHours.open} - {canteen.operatingHours.close}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        className="w-full h-11 px-4 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600"
                                        aria-label={`View products from ${canteen.name}`}
                                    >
                                        View Products
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Canteens
