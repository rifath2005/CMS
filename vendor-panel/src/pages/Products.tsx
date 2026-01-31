import { useState, useEffect } from 'react'
import { productService } from '../services/productService'
import { Product } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import ProductForm from '../components/ProductForm'
import { Plus, Edit, Trash2, Package, AlertCircle } from 'lucide-react'

const Products = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
    const [deletingId, setDeletingId] = useState<string | null>(null)

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
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Product Image */}
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={product.imageUrl || '/placeholder-product.png'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-product.png'
                                    }}
                                />
                                {!product.isAvailable && (
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
                                    <h3 className="font-semibold text-lg">{product.name}</h3>
                                    <span className="text-primary-600 font-bold">₹{product.price.toFixed(2)}</span>
                                </div>

                                {product.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        {product.category}
                                    </span>
                                    <div className="flex items-center">
                                        {product.stockQuantity === 0 ? (
                                            <span className="text-xs text-red-600 font-medium flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Out of Stock
                                            </span>
                                        ) : product.stockQuantity < 10 ? (
                                            <span className="text-xs text-yellow-600 font-medium flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Low Stock: {product.stockQuantity}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-green-600 font-medium">
                                                Stock: {product.stockQuantity}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Stock Controls */}
                                <div className="flex items-center space-x-2 mb-3">
                                    <button
                                        onClick={() => handleStockUpdate(product.id, product.stockQuantity - 1)}
                                        disabled={product.stockQuantity === 0}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm font-medium flex-1 text-center">
                                        Adjust Stock
                                    </span>
                                    <button
                                        onClick={() => handleStockUpdate(product.id, product.stockQuantity + 1)}
                                        className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEditProduct(product)}
                                        className="flex-1 bg-primary-50 text-primary-600 py-2 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        disabled={deletingId === product.id}
                                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
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
                    ))}
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
