import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Product } from '../../types'
import api from '../../services/api'
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface ProductFormData {
    name: string
    description: string
    price: number
    category: string
    stockQuantity: number
    imageUrl: string
}

const VendorProducts = () => {
    const { user } = useAuthStore()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: 0,
        category: '',
        stockQuantity: 0,
        imageUrl: ''
    })
    const [vendorId, setVendorId] = useState<string | null>(null)

    useEffect(() => {
        if (user?.id) {
            fetchVendorId()
        }
    }, [user])

    useEffect(() => {
        if (vendorId) {
            fetchProducts()
        }
    }, [vendorId])

    const fetchVendorId = async () => {
        try {
            // Get the canteen for this vendor user to find their vendor_id
            const response = await api.get(`/canteens/user/${user?.id}`)
            if (response.data.data) {
                setVendorId(response.data.data.vendorId)
            }
        } catch (error) {
            console.error('Failed to fetch vendor ID:', error)
        }
    }

    const fetchProducts = async () => {
        if (!vendorId) return

        try {
            setLoading(true)
            const response = await api.get(`/products/vendor/${vendorId}`)
            setProducts(response.data.data || [])
        } catch (error) {
            console.error('Failed to fetch products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, formData)
                alert('Product updated!')
            } else {
                // Don't send vendorId - it will come from JWT token
                await api.post('/products', formData)
                alert('Product created!')
            }
            
            fetchProducts()
            handleCloseModal()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message || error.message
            alert(`Error: ${errorMsg}`)
            console.error('Error:', error.response?.data || error)
        }
    }

    const handleDelete = async (productId: string) => {
        if (!confirm('Delete this product?')) return

        try {
            await api.delete(`/products/${productId}`)
            fetchProducts()
        } catch (error) {
            alert('Failed to delete product')
        }
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stockQuantity: product.stockQuantity,
            imageUrl: product.imageUrl
        })
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingProduct(null)
        setFormData({
            name: '',
            description: '',
            price: 0,
            category: '',
            stockQuantity: 0,
            imageUrl: ''
        })
    }

    const updateStock = async (productId: string, quantity: number) => {
        try {
            await api.patch(`/products/${productId}/stock`, { quantity })
            fetchProducts()
        } catch (error) {
            alert('Failed to update stock')
        }
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
                    <h1 className="text-3xl font-bold mb-2">Product Management</h1>
                    <p className="text-gray-600">Manage your menu items</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Product</span>
                </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
                        <PlusIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Products Yet</h3>
                        <p className="text-gray-600 mb-4">Add your first product to get started</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Add Product
                        </button>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/300x200'}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-lg">{product.name}</h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {product.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                                <p className="text-sm text-gray-500 mb-2">Category: {product.category}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                                    <span className="text-sm text-gray-600">Stock: {product.stockQuantity}</span>
                                </div>

                                <div className="flex items-center space-x-2 mb-4">
                                    <button
                                        onClick={() => updateStock(product.id, Math.max(0, product.stockQuantity - 10))}
                                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                                    >
                                        -10
                                    </button>
                                    <button
                                        onClick={() => updateStock(product.id, product.stockQuantity + 10)}
                                        className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm"
                                    >
                                        +10
                                    </button>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category *</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VendorProducts
