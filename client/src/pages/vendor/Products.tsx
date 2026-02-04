import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Product } from '../../types'
import api from '../../services/api'
import { PencilIcon, TrashIcon, PlusIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import { cache } from '../../utils/cache'

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
    const [totalProducts, setTotalProducts] = useState(0)
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
    const [displayCount, setDisplayCount] = useState(20) // Increased from 10 to 20
    const [initialLoad, setInitialLoad] = useState(true) // Track first load
    const [error, setError] = useState<string | null>(null) // Track errors

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
            console.log('Fetching vendor ID for user:', user?.id)
            // Get the canteen for this vendor user to find their vendor_id
            const response = await api.get(`/canteens/user/${user?.id}`)
            console.log('Vendor ID response:', response.data)
            if (response.data.data) {
                console.log('Setting vendor ID:', response.data.data.vendorId)
                setVendorId(response.data.data.vendorId)
                setError(null)
            } else {
                console.error('No vendor data found in response')
                setError('No vendor found for this user. Please contact admin.')
                setLoading(false)
                setInitialLoad(false)
            }
        } catch (error: any) {
            console.error('Failed to fetch vendor ID:', error)
            setError(error.response?.data?.error?.message || 'Failed to load vendor information')
            setLoading(false)
            setInitialLoad(false)
        }
    }

    const fetchProducts = async () => {
        if (!vendorId) {
            console.log('No vendor ID, skipping product fetch')
            return
        }

        try {
            console.log('Fetching products for vendor:', vendorId)
            // Check cache first for INSTANT loading
            const cacheKey = `vendor-products-${vendorId}`
            const cachedData = cache.get<{ products: Product[], total: number }>(cacheKey)

            if (cachedData) {
                console.log('Using cached products:', cachedData.products.length)
                // INSTANT: Show cached data immediately
                setProducts(cachedData.products)
                setTotalProducts(cachedData.total)
                setLoading(false)
                setInitialLoad(false)
                // Load fresh data in background silently
                loadFreshProducts(cacheKey, true)
                return
            }

            // First load - show loading
            if (initialLoad) {
                console.log('First load, showing skeleton')
                setLoading(true)
            }
            await loadFreshProducts(cacheKey, false)
        } catch (error) {
            console.error('Failed to fetch products:', error)
            setProducts([])
            setTotalProducts(0)
            setLoading(false)
            setInitialLoad(false)
        }
    }

    const loadFreshProducts = async (cacheKey: string, silent: boolean = false) => {
        if (!vendorId) return

        try {
            console.log('Loading fresh products from API...')
            // Fetch with limit for faster initial load
            const response = await api.get(`/products/vendor/${vendorId}?limit=100`)
            console.log('Products API response:', response.data)
            const productsData = response.data.data || []
            const total = response.data.total || productsData.length
            
            console.log(`Loaded ${productsData.length} products`)
            setProducts(productsData)
            setTotalProducts(total)
            setError(null)
            
            // Cache for 2 minutes (products don't change frequently)
            cache.set(cacheKey, { products: productsData, total }, 120000)
        } catch (error: any) {
            console.error('Error loading fresh products:', error)
            setError(error.response?.data?.error?.message || 'Failed to load products')
        } finally {
            if (!silent) {
                setLoading(false)
                setInitialLoad(false)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (editingProduct) {
                // Optimistic update
                setProducts(prev => prev.map(p => 
                    p.id === editingProduct.id ? { ...p, ...formData } : p
                ))
                
                await api.put(`/products/${editingProduct.id}`, formData)
                alert('Product updated!')
            } else {
                await api.post('/products', formData)
                alert('Product created!')
            }
            
            // Invalidate cache and refresh
            cache.invalidatePattern('vendor-products')
            fetchProducts()
            handleCloseModal()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message || error.message
            alert(`Error: ${errorMsg}`)
            console.error('Error:', error.response?.data || error)
            // Revert optimistic update on error
            if (editingProduct) {
                fetchProducts()
            }
        }
    }

    const handleDelete = async (productId: string) => {
        if (!confirm('Delete this product?')) return

        try {
            // Optimistic update
            setProducts(prev => prev.filter(p => p.id !== productId))
            
            await api.delete(`/products/${productId}`)
            
            // Invalidate cache
            cache.invalidatePattern('vendor-products')
        } catch (error) {
            alert('Failed to delete product')
            // Revert on error
            fetchProducts()
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
            // Optimistic update
            setProducts(prev => prev.map(p => 
                p.id === productId ? { ...p, stockQuantity: quantity } : p
            ))
            
            await api.patch(`/products/${productId}/stock`, { quantity })
            
            // Invalidate cache
            cache.invalidatePattern('vendor-products')
        } catch (error) {
            alert('Failed to update stock')
            // Revert on error
            fetchProducts()
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

    if (loading && initialLoad) {
        return (
            <div className="p-3 sm:p-4 lg:p-6">
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="w-full sm:w-auto">
                        <div className="h-8 sm:h-10 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="h-11 bg-gray-200 rounded flex-1 sm:w-40 animate-pulse"></div>
                        <div className="h-11 bg-gray-200 rounded flex-1 sm:w-32 animate-pulse"></div>
                    </div>
                </div>

                {/* Skeleton Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                            <div className="w-full h-40 sm:h-48 bg-gray-200"></div>
                            <div className="p-3 sm:p-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                                <div className="flex justify-between mb-3">
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-11 bg-gray-200 rounded flex-1"></div>
                                    <div className="h-11 bg-gray-200 rounded flex-1"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Show error if products failed to load
    if (error) {
        return (
            <div className="p-3 sm:p-4 lg:p-6">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Product Management</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Manage your menu items</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Products</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null)
                            setLoading(true)
                            setInitialLoad(true)
                            if (user?.id) {
                                fetchVendorId()
                            }
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium min-h-[44px]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Product Management</h1>
                    <p className="text-xs sm:text-sm text-gray-600">Manage your menu items</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-[44px] text-sm sm:text-base"
                    >
                        <ArrowUpTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Import Products</span>
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium min-h-[44px] text-sm sm:text-base"
                    >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Products Grid - 4 cards per row optimized for all devices */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
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
                                className="w-full h-40 sm:h-48 object-cover"
                                loading="lazy"
                            />
                            <div className="p-3 sm:p-4">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-xs sm:text-sm line-clamp-1">{product.name}</h3>
                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                        product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {product.isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-600 mb-1 line-clamp-2">{product.description}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 mb-2">Category: {product.category}</p>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-base sm:text-lg font-bold text-green-600">₹{product.price}</span>
                                    <span className="text-[10px] sm:text-xs text-gray-600">Stock: {product.stockQuantity}</span>
                                </div>

                                <div className="flex items-center space-x-1 sm:space-x-2 mb-3">
                                    <button
                                        onClick={() => updateStock(product.id, Math.max(0, product.stockQuantity - 10))}
                                        className="flex-1 px-2 py-2 sm:py-2.5 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs sm:text-sm min-h-[40px]"
                                    >
                                        -10
                                    </button>
                                    <button
                                        onClick={() => updateStock(product.id, product.stockQuantity + 10)}
                                        className="flex-1 px-2 py-2 sm:py-2.5 bg-green-100 text-green-600 rounded hover:bg-green-200 text-xs sm:text-sm min-h-[40px]"
                                    >
                                        +10
                                    </button>
                                </div>

                                <div className="flex space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 sm:py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm min-h-[44px]"
                                    >
                                        <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 flex items-center justify-center space-x-1 px-2 py-2 sm:py-2.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm min-h-[44px]"
                                    >
                                        <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
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
                        onClick={() => setDisplayCount(prev => prev + 20)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                        Load More Products
                    </button>
                </div>
            )}

            {/* Showing count */}
            {products.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                    Showing {Math.min(displayCount, products.length)} of {totalProducts} products
                </div>
            )}

            {/* Add/Edit Modal - Responsive for all devices */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium min-h-[44px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium min-h-[44px]"
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

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => {
                                        setShowImportModal(false)
                                        setImportResult(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium min-h-[44px] text-sm sm:text-base"
                                >
                                    Close
                                </button>
                                {importResult && (
                                    <button
                                        onClick={() => setImportResult(null)}
                                        className="flex-1 px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium min-h-[44px] text-sm sm:text-base"
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
