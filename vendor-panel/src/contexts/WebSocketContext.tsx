import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

interface WebSocketContextType {
    socket: Socket | null
    isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
    socket: null,
    isConnected: false,
})

export const useWebSocket = () => useContext(WebSocketContext)

interface WebSocketProviderProps {
    children: ReactNode
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const { token, user } = useAuthStore()

    useEffect(() => {
        if (!token || !user) return

        const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

        const newSocket = io(WS_URL, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
        })

        newSocket.on('connect', () => {
            console.log('WebSocket connected')
            setIsConnected(true)
        })

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected')
            setIsConnected(false)
        })

        newSocket.on('error', (error) => {
            console.error('WebSocket error:', error)
        })

        setSocket(newSocket)

        return () => {
            newSocket.close()
        }
    }, [token, user])

    return (
        <WebSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    )
}
