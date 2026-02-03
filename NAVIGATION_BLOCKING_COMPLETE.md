# Navigation Blocking Implementation - COMPLETE

## Overview
Implemented comprehensive navigation blocking for the Digital Bill page to prevent users from leaving until their order is delivered or expired.

## Implementation Details

### 1. Navigation Blocking Mechanisms

#### Browser Navigation (Refresh/Close)
- **Method**: `beforeunload` event listener
- **Behavior**: Shows browser's native confirmation dialog when user tries to refresh or close the tab
- **Active When**: `canLeave` is `false`

#### Back Button Navigation
- **Method**: `popstate` event listener with history manipulation
- **Behavior**: Prevents back button navigation and shows alert message
- **Implementation**: Pushes current state to history stack and intercepts popstate events
- **Alert Message**: "Please wait for your order to be delivered or expire before leaving this page."

#### In-App Navigation
- **Method**: Custom click handler on "Back to Dashboard" button
- **Behavior**: Button is disabled (grayed out) and shows alert when clicked
- **Visual Feedback**: Gray background with disabled cursor

### 2. When Navigation is Allowed (`canLeave = true`)

Navigation is permitted when:
1. **Order is DELIVERED** - Vendor has marked the order as delivered
2. **Order is EXPIRED** - Timer has reached 0:00 and order is marked as EXPIRED in database
3. **Error Loading Bill** - If there's an error fetching the bill data
4. **Bill Already Delivered/Expired** - When initially loading a completed order

### 3. Real-Time Status Updates

#### WebSocket Integration
- Listens for `order:status-update` and `orderStatusUpdate` events
- Updates bill status in real-time without manual refresh
- Automatically sets `canLeave = true` when status becomes DELIVERED or EXPIRED

#### Automatic Expiration
- CountdownTimer component calls `handleExpire()` when timer reaches 0:00
- `handleExpire()` function:
  - Sets `isExpired = true`
  - Sets `canLeave = true`
  - Updates local bill state
  - Calls backend API: `POST /orders/:orderId/expire`
  - Backend updates database: `UPDATE orders SET status = 'EXPIRED'`

### 4. User Experience

#### Warning Message
Yellow alert box displayed at top of page when navigation is blocked:
```
⚠️ Please wait for your order
You cannot leave this page until your order is delivered or expires.
Show this QR code to the vendor to collect your order.
```

#### Button States
- **Active (can leave)**: White background, gray border, hover effect
- **Disabled (cannot leave)**: Gray background, disabled cursor, shows alert on click

#### Timer Display
- **15 minutes** countdown from payment time
- Color coding:
  - Green: More than 5 minutes remaining
  - Amber: 5 minutes or less
  - Red: Expired (0:00)

## Technical Implementation

### File: `CMS/client/src/pages/user/DigitalBill.tsx`

```typescript
// State management
const [canLeave, setCanLeave] = useState(false)

// Browser navigation blocking
useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (!canLeave) {
            e.preventDefault()
            e.returnValue = ''
        }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [canLeave])

// Back button blocking
useEffect(() => {
    if (!canLeave) {
        const handlePopState = (e: PopStateEvent) => {
            e.preventDefault()
            window.history.pushState(null, '', window.location.pathname)
            alert('Please wait for your order to be delivered or expire before leaving this page.')
        }
        window.history.pushState(null, '', window.location.pathname)
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }
}, [canLeave])

// WebSocket status updates
useEffect(() => {
    const handleStatusUpdate = (data: any) => {
        if (data.orderId === orderId) {
            if (data.status === 'DELIVERED' || data.status === 'EXPIRED') {
                setCanLeave(true)
            }
        }
    }
    socket.on('order:status-update', handleStatusUpdate)
    socket.on('orderStatusUpdate', handleStatusUpdate)
    return () => {
        socket.off('order:status-update', handleStatusUpdate)
        socket.off('orderStatusUpdate', handleStatusUpdate)
    }
}, [socket, orderId, bill])

// Expiration handler
const handleExpire = async () => {
    setIsExpired(true)
    setCanLeave(true)
    if (bill && orderId) {
        setBill({ ...bill, isValid: false })
        await orderService.markOrderAsExpired(orderId)
    }
}
```

## Backend Support

### Endpoint: `POST /api/orders/:orderId/expire`
**File**: `CMS/src/routes/order.routes.ts`

```typescript
router.post('/:orderId/expire', async (req: Request, res: Response) => {
    const { orderId } = req.params;
    await pool.query(
        `UPDATE orders 
         SET status = 'EXPIRED' 
         WHERE id = $1 AND status NOT IN ('DELIVERED', 'EXPIRED')`,
        [orderId]
    );
    res.status(200).json({
        success: true,
        message: 'Order marked as expired'
    });
});
```

### Service Method
**File**: `CMS/client/src/services/orderService.ts`

```typescript
async markOrderAsExpired(orderId: string): Promise<void> {
    await api.post(`/orders/${orderId}/expire`)
}
```

## Testing Checklist

- [x] Browser refresh shows confirmation dialog
- [x] Browser close/tab close shows confirmation dialog
- [x] Back button navigation is blocked with alert
- [x] "Back to Dashboard" button is disabled when order is active
- [x] Navigation allowed after order is DELIVERED
- [x] Navigation allowed after timer expires (EXPIRED status)
- [x] Real-time status updates via WebSocket
- [x] Database updated when order expires
- [x] Warning message displayed when navigation is blocked
- [x] Timer shows 15 minutes countdown
- [x] Expired orders appear in order history

## Related Files

1. `CMS/client/src/pages/user/DigitalBill.tsx` - Main implementation
2. `CMS/client/src/components/shared/CountdownTimer.tsx` - Timer component
3. `CMS/client/src/services/orderService.ts` - API service
4. `CMS/src/routes/order.routes.ts` - Backend routes
5. `CMS/src/services/order/OrderHistoryService.ts` - Order history filtering

## Status: ✅ COMPLETE

All requirements have been implemented:
- ✅ User cannot leave digital bill page until order is delivered or expired
- ✅ Real-time status updates without manual refresh
- ✅ Automatic order expiration in database
- ✅ Expired orders added to order history
- ✅ Stock quantities update when orders are placed
- ✅ 15-minute timer for orders
- ✅ Navigation blocking with multiple mechanisms
