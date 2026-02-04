import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Product } from '../../types'
import api from '../../services/api'
import { PencilIcon, TrashIcon, PlusIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

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
    const [showImportModal, setShowImportModal] = useState(false)
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<{success: number, failed: number, errors: string[]} | null>(null)
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
    const [displayCount, setDisplayCount] = useState(10)

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

    const downloadTemplate = () => {
        const template = [
            {
                'Product Name': 'Masala Dosa',
                'Category': 'MAIN_COURSE',
                'Price': 60,
                'Stock Quantity': 50,
                'Description': 'South Indian crispy dosa',
                'Image URL': 'https://example.com/dosa.jpg'
            },
            {
                'Product Name': 'Filter Coffee',
                'Category': 'BEVERAGES',
                'Price': 30,
                'Stock Quantity': 100,
                'Description': 'Traditional filter coffee',
                'Image URL': 'https://example.com/coffee.jpg'
            }
        ]

        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Products')
        XLSX.writeFile(wb, 'product_import_template.xlsx')
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        setImportResult(null)

        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            const products = jsonData.map((row: any) => ({
                name: row['Product Name'],
                category: row['Category'],
                price: parseFloat(row['Price']),
                stockQuantity: parseInt(row['Stock Quantity']),
                description: row['Description'] || '',
                imageUrl: row['Image URL'] || ''
            }))

            const response = await api.post('/products/bulk', { products })
            
            setImportResult({
                success: response.data.data.success,
                failed: response.data.data.failed,
                errors: response.data.data.errors || []
            })

            fetchProducts()
        } catch (error: any) {
            alert('Import failed: ' + (error.response?.data?.error?.message || error.message))
        } finally {
            setImporting(false)
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
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        <span>Import Products</span>
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Products Grid - 5 cards per row with smaller size */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    products.slice(0, displayCount).map((product) => (
                        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/300x200'}
                                alt={product.name}
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                        product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {product.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mb-1 line-clamp-2">{product.description}</p>
                                <p className="text-xs text-gray-500 mb-2">Category: {product.category}</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                                    <span className="text-xs text-gray-600">Stock: {product.stockQuantity}</span>
                                </div>

                                <div className="flex items-center space-x-1 mb-3">
                                    <button
                                        onClick={() => updateStock(product.id, Math.max(0, product.stockQuantity - 10))}
                                        className="flex-1 px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                                    >
                                        -10
                                    </button>
                                    <button
                                        onClick={() => updateStock(product.id, product.stockQuantity + 10)}
                                        className="flex-1 px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-xs"
                                    >
                                        +10
                                    </button>
                                </div>

                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                    >
                                        <PencilIcon className="h-3 w-3" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                    >
                                        <TrashIcon className="h-3 w-3" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More Button */}
            {products.length > displayCount && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setDisplayCount(prev => prev + 10)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                        Load More Products
                    </button>
                </div>
            )}

            {/* Showing count */}
            {products.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                    Showing {Math.min(displayCount, products.length)} of {products.length} products
                </div>
            )}

            {/* Add/Edit Modal - Compact Landscape Style */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-3">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Category *</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        rows={2}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium mb-1">Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Import Products</h2>
                            
                            {!importResult ? (
                                <>
                                    <div className="mb-6">
                                        <p className="text-gray-600 mb-4">
                                            Upload an Excel file with your products. Download the template to see the required format.
                                        </p>
                                        
                                        <button
                                            onClick={downloadTemplate}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium mb-4"
                                        >
                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                            <span>Download Template</span>
                                        </button>

                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="file-upload"
                                                disabled={importing}
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="cursor-pointer"
                                            >
                                                <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600 font-medium">
                                                    {importing ? 'Importing...' : 'Click to upload Excel file'}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Supports .xlsx and .xls files
                                                </p>
                                            </label>
                                        </div>

                                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-bold text-blue-900 mb-2">Required Columns:</h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>• Product Name (required)</li>
                                                <li>• Category (BREAKFAST, SNACKS, MAIN_COURSE, BEVERAGES, DESSERTS)</li>
                                                <li>• Price (number)</li>
                                                <li>• Stock Quantity (number)</li>
                                                <li>• Description (optional)</li>
                                                <li>• Image URL (optional)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="mb-6">
                                    <div className={`p-4 rounded-lg mb-4 ${
                                        importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                                    }`}>
                                        <h3 className="font-bold mb-2">Import Complete!</h3>
                                        <p className="text-green-700">✅ Successfully imported: {importResult.success} products</p>
                                        {importResult.failed > 0 && (
                                            <p className="text-red-700">❌ Failed: {importResult.failed} products</p>
                                        )}
                                    </div>

                                    {importResult.errors.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <h4 className="font-bold text-red-900 mb-2">Errors:</h4>
                                            <ul className="text-sm text-red-800 space-y-1">
                                                {importResult.errors.map((error, idx) => (
                                                    <li key={idx}>• {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false)
                                        setImportResult(null)
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Close
                                </button>
                                {importResult && (
                                    <button
                                        onClick={() => setImportResult(null)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Import More
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VendorProducts
