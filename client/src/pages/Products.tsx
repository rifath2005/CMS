import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { useCartStore } from '../store/cartStore'
import { Product } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

const Products = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const { addItem, items: cartItems } = useCartStore()

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await productService.getProducts()
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

    if (loading) {
        return <LoadingSpinner />
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Products</h1>
                <p className="text-gray-600">Browse products from your institution's canteens</p>
            </div>

            {error && (
                <ErrorAlert message={error} onClose={() => setError(null)} />
            )}

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="sm:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        {searchQuery || selectedCategory !== 'all'
                            ? 'No products found matching your criteria'
                            : 'No products available'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-200">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Availability Badge */}
                                {!product.isAvailable || product.stockQuantity === 0 ? (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Out of Stock
                                    </div>
                                ) : product.stockQuantity < 10 ? (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Low Stock
                                    </div>
                                ) : null}
                            </div>

                            {/* Product Details */}
                            <div className="p-4">
                                <div className="mb-2">
                                    <span className="text-xs text-gray-500 uppercase">{product.category}</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{product.name}</h3>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl font-bold text-blue-600">
                                        ₹{product.price.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Stock: {product.stockQuantity}
                                    </span>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    disabled={!product.isAvailable || product.stockQuantity === 0}
                                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${!product.isAvailable || product.stockQuantity === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : isInCart(product.id)
                                                ? 'bg-green-500 text-white hover:bg-green-600'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                        }`}
                                >
                                    {!product.isAvailable || product.stockQuantity === 0
                                        ? 'Out of Stock'
                                        : isInCart(product.id)
                                            ? `In Cart (${getCartQuantity(product.id)})`
                                            : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Products
