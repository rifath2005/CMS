import { useState, useEffect, useRef } from 'react'
import { productService } from '../services/productService'
import { Product } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import ProductForm from '../components/ProductForm'
import { Plus, Edit, Trash2, Package, AlertCircle, AlertTriangle } from 'lucide-react'

const Products = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [editingStockId, setEditingStockId] = useState<string | null>(null)
    const [stockInputValues, setStockInputValues] = useState<Record<string, string>>({})
    const stockInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setIsLoading(true)
            const data = await productService.getVendorProducts()
            setProducts(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load products')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddProduct = () => {
        setEditingProduct(undefined)
        setShowForm(true)
    }

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product)
        setShowForm(true)
    }

    const handleSubmitProduct = async (data: Partial<Product>) => {
        if (editingProduct) {
            await productService.updateProduct(editingProduct.id, data)
        } else {
            await productService.createProduct(data)
        }
        setShowForm(false)
        setEditingProduct(undefined)
        await fetchProducts()
    }

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        try {
            setDeletingId(productId)
            await productService.deleteProduct(productId)
            await fetchProducts()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to delete product')
        } finally {
            setDeletingId(null)
        }
    }

    const handleStockUpdate = async (productId: string, newQuantity: number) => {
        try {
            await productService.updateStock(productId, newQuantity)
            await fetchProducts()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update stock')
        }
    }

    const handleInlineStockEdit = (productId: string) => {
        const product = products.find(p => p.id === productId)
        if (product) {
            setEditingStockId(productId)
            setStockInputValues({ ...stockInputValues, [productId]: product.stockQuantity.toString() })
            // Focus the input after state update
            setTimeout(() => {
                stockInputRefs.current[productId]?.focus()
                stockInputRefs.current[productId]?.select()
            }, 0)
        }
    }

    const handleStockInputChange = (productId: string, value: string) => {
        // Only allow numeric input
        if (value === '' || /^\d+$/.test(value)) {
            setStockInputValues({ ...stockInputValues, [productId]: value })
        }
    }

    const handleStockInputBlur = async (productId: string) => {
        const newValue = stockInputValues[productId]
        if (newValue !== undefined && newValue !== '') {
            const quantity = parseInt(newValue, 10)
            if (!isNaN(quantity) && quantity >= 0) {
                await handleStockUpdate(productId, quantity)
            }
        }
        setEditingStockId(null)
    }

    const handleStockInputKeyDown = async (e: React.KeyboardEvent, productId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            await handleStockInputBlur(productId)
        } else if (e.key === 'Escape') {
            setEditingStockId(null)
            setStockInputValues({ ...stockInputValues, [productId]: '' })
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
                <h1 className="text-3xl font-bold">Product Management</h1>
                <button
                    onClick={handleAddProduct}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                </button>
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h2>
                    <p className="text-gray-500 mb-6">Add your first product to get started!</p>
                    <button
                        onClick={handleAddProduct}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10
                        const isOutOfStock = product.stockQuantity === 0
                        const isUnavailable = !product.isAvailable

                        return (
                            <div
                                key={product.id}
                                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isUnavailable ? 'opacity-60' : ''
                                    }`}
                            >
                                {/* Product Image */}
                                <div className="relative h-48 bg-gray-200">
                                    <img
                                        src={product.imageUrl || '/placeholder-product.png'}
                                        alt={product.name}
                                        className={`w-full h-full object-cover ${isUnavailable ? 'opacity-50' : ''
                                            }`}
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder-product.png'
                                        }}
                                    />
                                    {isUnavailable && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                Unavailable
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-semibold text-lg ${isUnavailable ? 'text-gray-500' : ''
                                            }`}>
                                            {product.name}
                                        </h3>
                                        <span className={`font-bold ${isUnavailable ? 'text-gray-400' : 'text-primary-600'
                                            }`}>
                                            ₹{product.price.toFixed(2)}
                                        </span>
                                    </div>

                                    {product.description && (
                                        <p className={`text-sm mb-3 line-clamp-2 ${isUnavailable ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            {product.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs px-2 py-1 rounded ${isUnavailable
                                                ? 'bg-gray-50 text-gray-400'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {product.category}
                                        </span>
                                        <div className="flex items-center">
                                            {isOutOfStock ? (
                                                <span className="text-xs text-red-600 font-semibold flex items-center bg-red-50 px-2 py-1 rounded border border-red-200">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    Out of Stock
                                                </span>
                                            ) : isLowStock ? (
                                                <span className="text-xs text-yellow-700 font-semibold flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-300">
                                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                                    Low Stock: {product.stockQuantity}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-green-600 font-medium">
                                                    Stock: {product.stockQuantity}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Stock Editing */}
                                    <div className="mb-3">
                                        {editingStockId === product.id ? (
                                            <div className="flex items-center space-x-2">
                                                <label className="text-sm font-medium text-gray-700 flex-shrink-0">
                                                    Stock:
                                                </label>
                                                <input
                                                    ref={(el) => stockInputRefs.current[product.id] = el}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={stockInputValues[product.id] || ''}
                                                    onChange={(e) => handleStockInputChange(product.id, e.target.value)}
                                                    onBlur={() => handleStockInputBlur(product.id)}
                                                    onKeyDown={(e) => handleStockInputKeyDown(e, product.id)}
                                                    className="flex-1 px-3 py-2 border border-primary-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-semibold"
                                                    placeholder="Enter quantity"
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleInlineStockEdit(product.id)}
                                                disabled={isUnavailable}
                                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isUnavailable
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Click to edit stock ({product.stockQuantity})
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEditProduct(product)}
                                            disabled={isUnavailable}
                                            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center ${isUnavailable
                                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                                }`}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            disabled={deletingId === product.id || isUnavailable}
                                            className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center ${isUnavailable
                                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50'
                                                }`}
                                        >
                                            {deletingId === product.id ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Product Form Modal */}
            {showForm && (
                <ProductForm
                    product={editingProduct}
                    onSubmit={handleSubmitProduct}
                    onCancel={() => {
                        setShowForm(false)
                        setEditingProduct(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default Products
