import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { Product } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorAlert from '../components/ErrorAlert'

const Products = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const { addItem, items: cartItems } = useCartStore()
    const { user } = useAuthStore()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        if (!user?.institutionId) {
            setError('User institution not found')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)
            const data = await productService.getProducts(user.institutionId)
            setProducts(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (product: Product) => {
        if (!product.isAvailable || product.stockQuantity === 0) {
            return
        }

        addItem({
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price,
            imageUrl: product.imageUrl,
            vendorId: product.vendorId,
        })
    }

    const isInCart = (productId: string) => {
        return cartItems.some(item => item.productId === productId)
    }

    const getCartQuantity = (productId: string) => {
        const item = cartItems.find(item => item.productId === productId)
        return item?.quantity || 0
    }

    // Get unique categories
    const categories = ['all', ...new Set(products.map(p => p.category))]

    // Filter products
    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    // Check if product is out of stock
    const isOutOfStock = (product: Product) => {
        return !product.isAvailable || product.stockQuantity === 0
    }

    if (loading) {
        return (
            <div className="pb-8">
                <div className="mb-6">
                    <div className="skeleton-title mb-2" />
                    <div className="skeleton-text w-2/3" />
                </div>
                <div className="mb-4">
                    <div className="skeleton h-10 w-full rounded-lg" />
                </div>
                <div className="mb-6 flex gap-2">
                    <div className="skeleton h-10 w-32 rounded-full" />
                    <div className="skeleton h-10 w-32 rounded-full" />
                    <div className="skeleton h-10 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <LoadingSkeleton variant="product" count={8} />
                </div>
            </div>
        )
    }

    return (
        <div className="pb-8">
            {/* Header - 8px grid spacing (mb-6 = 24px = 3 × 8px) */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Products</h1>
                <p className="text-gray-600">Browse products from your institution's canteens</p>
            </div>

            {error && (
                <ErrorAlert message={error} onClose={() => setError(null)} />
            )}

            {/* Search Bar - 8px grid spacing (mb-4 = 16px = 2 × 8px) */}
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

            {/* Category Filters - Horizontal Scrollable Chips - 8px grid spacing (mb-6 = 24px = 3 × 8px) */}
            <div className="mb-6 -mx-4 px-4 overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-max">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-base min-h-touch ${selectedCategory === category
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                }`}
                            aria-pressed={selectedCategory === category}
                        >
                            {category === 'all' ? 'All Categories' : category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid - Card-based layout optimized for mobile */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        {searchQuery || selectedCategory !== 'all'
                            ? 'No products found matching your criteria'
                            : 'No products available'}
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
                                {/* Product Image - 192px height (h-48) */}
                                <div className="relative h-48 bg-gray-200">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={`w-full h-full object-cover transition-all duration-base ${outOfStock ? 'grayscale' : ''
                                                }`}
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
                                        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center transition-all duration-base">
                                            <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                Out of Stock
                                            </div>
                                        </div>
                                    )}

                                    {/* Low Stock Badge */}
                                    {!outOfStock && product.stockQuantity < 10 && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold transition-all duration-base">
                                            Low Stock
                                        </div>
                                    )}

                                    {/* Category Chip at top */}
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-white bg-opacity-90 text-gray-700 px-3 py-1 rounded-full text-xs font-medium transition-all duration-base">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Product Details - 8px grid spacing (p-4 = 16px = 2 × 8px) */}
                                <div className="p-4">
                                    <h3 className={`text-lg font-semibold mb-2 line-clamp-1 transition-colors duration-base ${outOfStock ? 'text-gray-500' : 'text-gray-900'
                                        }`}>
                                        {product.name}
                                    </h3>
                                    <p className={`text-sm mb-3 line-clamp-2 transition-colors duration-base ${outOfStock ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-2xl font-bold transition-colors duration-base ${outOfStock ? 'text-gray-400' : 'text-blue-600'
                                            }`}>
                                            ₹{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Stock: {product.stockQuantity}
                                        </span>
                                    </div>

                                    {/* Add to Cart Button - 44px minimum touch target */}
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        disabled={outOfStock}
                                        className={`w-full h-11 px-4 rounded-lg font-semibold transition-all duration-base ${outOfStock
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isInCart(product.id)
                                                ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
                                                : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
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
    )
}

export default Products
