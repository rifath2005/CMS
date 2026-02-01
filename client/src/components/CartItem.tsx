import { CartItem as CartItemType } from '../types'
import { Trash2, Plus, Minus } from 'lucide-react'

interface CartItemProps {
    item: CartItemType
    onUpdateQuantity: (productId: string, quantity: number) => void
    onRemove: (productId: string) => void
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4">
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
                <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                <p className="text-primary-600 font-medium">₹{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    disabled={item.quantity <= 1}
                >
                    <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Plus className="w-4 h-4 text-gray-600" />
                </button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
                <p className="font-semibold text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                </p>
            </div>

            {/* Remove Button */}
            <button
                onClick={() => onRemove(item.productId)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Remove item"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
    )
}

export default CartItem
