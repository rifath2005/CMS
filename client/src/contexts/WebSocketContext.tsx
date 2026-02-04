import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { OrderStatus } from '../types'

interface WebSocketContextType {
    socket: Socket | null
    isConnected: boolean
    onOrderUpdate: (callback: (data: OrderUpdateData) => void) => (() => void) | undefined
    onNewOrder: (callback: (data: NewOrderData) => void) => (() => void) | undefined
    onTimerUpdate: (callback: (data: TimerUpdateData) => void) => (() => void) | undefined
    onStockUpdate: (callback: (data: StockUpdateData) => void) => (() => void) | undefined
    onBillExpired: (callback: (data: BillExpiredData) => void) => (() => void) | undefined
}

interface OrderUpdateData {
    orderId: string
    status: OrderStatus
    timestamp: string
}

interface NewOrderData {
    orderId: string
    userId: string
    totalAmount: number
    items: any[]
    status: string
    message: string
    timestamp: string
}

interface TimerUpdateData {
    orderId: string
    remainingSeconds: number
    timestamp: string
}

interface StockUpdateData {
    productId: string
    stockQuantity: number
    isAvailable: boolean
    timestamp: string
}

interface BillExpiredData {
    orderId: string
    message: string
    timestamp: string
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWebSocket = () => {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider')
    }
    return context
}

interface WebSocketProviderProps {
    children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const { token, isAuthenticated } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (socket) {
                socket.disconnect()
                setSocket(null)
                setIsConnected(false)
            }
            return
        }

        // Use configured URL or default to current origin (which will be proxied by Vite)
        const WS_URL = import.meta.env.VITE_WS_URL || (window.location.protocol + '//' + window.location.host)

        const newSocket = io(WS_URL, {
            path: '/socket.io',
            auth: {
                token,
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            transports: ['websocket'] // Force WebSocket to avoid proxy polling errors
        })

        newSocket.on('connect', () => {
            console.log('WebSocket connected')
            setIsConnected(true)
        })

        newSocket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason)
            setIsConnected(false)
        })

        newSocket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err.message)
            // Stop trying to reconnect if authentication failed
            if (err.message.includes('Authentication') || err.message.includes('token')) {
                newSocket.disconnect()
            }
        })

        newSocket.on('connected', (data) => {
            console.log('WebSocket connection confirmed:', data)
        })

        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error)
        })

        setSocket(newSocket)

        return () => {
            newSocket.disconnect()
        }
    }, [isAuthenticated, token])

    const onOrderUpdate = useCallback((callback: (data: OrderUpdateData) => void) => {
        if (socket) {
            socket.on('order:status-update', callback)
            return () => {
                socket.off('order:status-update', callback)
            }
        }
    }, [socket])

    const onNewOrder = useCallback((callback: (data: NewOrderData) => void) => {
        if (socket) {
            socket.on('order:new', callback)
            return () => {
                socket.off('order:new', callback)
            }
        }
    }, [socket])

    const onTimerUpdate = useCallback((callback: (data: TimerUpdateData) => void) => {
        if (socket) {
            socket.on('bill:timer-update', callback)
            return () => {
                socket.off('bill:timer-update', callback)
            }
        }
    }, [socket])

    const onStockUpdate = useCallback((callback: (data: StockUpdateData) => void) => {
        if (socket) {
            socket.on('product:stock-update', callback)
            return () => {
                socket.off('product:stock-update', callback)
            }
        }
    }, [socket])

    const onBillExpired = useCallback((callback: (data: BillExpiredData) => void) => {
        if (socket) {
            socket.on('bill:expired', callback)
            return () => {
                socket.off('bill:expired', callback)
            }
        }
    }, [socket])

    const value: WebSocketContextType = {
        socket,
        isConnected,
        onOrderUpdate,
        onNewOrder,
        onTimerUpdate,
        onStockUpdate,
        onBillExpired,
    }

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
