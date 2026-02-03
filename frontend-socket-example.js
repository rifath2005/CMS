/**
 * Frontend Socket.IO Connection Example
 * Shows how to properly connect with JWT authentication
 */

// Example: Connecting to Socket.IO with JWT token
function connectToSocket(jwtToken) {
  // Initialize socket connection with JWT token in auth
  const socket = io('http://localhost:3000', {
    auth: {
      token: jwtToken  // Pass JWT token explicitly
    },
    transports: ['websocket', 'polling']
  });

  // Connection successful
  socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
  });

  // Listen for connection confirmation
  socket.on('connected', (data) => {
    console.log('Server confirmation:', data);
    // data contains: { message, userId, role, timestamp }
  });

  // Listen for new orders (canteen panel)
  socket.on('order:new', (orderData) => {
    console.log('New order received:', orderData);
    // Update canteen UI with new order
    updateCanteenOrderList(orderData);
  });

  // Listen for order status updates (user panel)
  socket.on('order:status-update', (update) => {
    console.log('Order status update:', update);
    // Update order status in UI
    updateOrderStatus(update.orderId, update.status);
  });

  // Listen for stock updates
  socket.on('product:stock-update', (stockData) => {
    console.log('Stock update:', stockData);
    // Update product stock in UI
    updateProductStock(stockData.productId, stockData.stockQuantity);
  });

  // Listen for low stock alerts (canteen panel)
  socket.on('product:low-stock', (alert) => {
    console.log('Low stock alert:', alert);
    // Show low stock notification
    showLowStockAlert(alert.productId, alert.stockQuantity);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Connection failed:', error.message);
    // Handle authentication errors
    if (error.message.includes('Authentication failed')) {
      // Redirect to login or refresh token
      handleAuthError();
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected the client, try to reconnect
      socket.connect();
    }
  });

  return socket;
}

// Example: Login and connect flow
async function loginAndConnect(email, password) {
  try {
    // 1. Login to get JWT token
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const loginData = await response.json();
    
    if (loginData.success) {
      // 2. Store JWT token
      const jwtToken = loginData.data.token;
      localStorage.setItem('jwt_token', jwtToken);
      
      // 3. Connect to Socket.IO with JWT
      const socket = connectToSocket(jwtToken);
      
      return { success: true, socket, user: loginData.data.user };
    } else {
      throw new Error(loginData.error.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: error.message };
  }
}

// Example: Reconnect with stored token
function reconnectWithStoredToken() {
  const storedToken = localStorage.getItem('jwt_token');
  if (storedToken) {
    return connectToSocket(storedToken);
  } else {
    console.log('No stored token found, redirect to login');
    return null;
  }
}

// UI Update Functions (implement based on your frontend framework)
function updateCanteenOrderList(orderData) {
  // Add new order to canteen dashboard
  const orderElement = document.createElement('div');
  orderElement.innerHTML = `
    <div class="order-card" data-order-id="${orderData.orderId}">
      <h3>New Order #${orderData.orderId.substring(0, 8)}</h3>
      <p>Total: ₹${orderData.totalAmount}</p>
      <p>Items: ${orderData.items.length}</p>
      <p>Expires: ${new Date(orderData.billExpiresAt).toLocaleTimeString()}</p>
      <button onclick="updateOrderStatus('${orderData.orderId}', 'PREPARING')">
        Start Preparing
      </button>
    </div>
  `;
  document.getElementById('orders-list').prepend(orderElement);
  
  // Play notification sound
  playNotificationSound();
}

function updateOrderStatus(orderId, status) {
  const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
  if (orderElement) {
    const statusElement = orderElement.querySelector('.status');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `status status-${status.toLowerCase()}`;
    }
  }
}

function updateProductStock(productId, stockQuantity) {
  const productElement = document.querySelector(`[data-product-id="${productId}"]`);
  if (productElement) {
    const stockElement = productElement.querySelector('.stock-quantity');
    if (stockElement) {
      stockElement.textContent = stockQuantity;
      
      // Add low stock warning if needed
      if (stockQuantity < 10) {
        productElement.classList.add('low-stock');
      } else {
        productElement.classList.remove('low-stock');
      }
    }
  }
}

function showLowStockAlert(productId, stockQuantity) {
  // Show notification or modal
  const notification = document.createElement('div');
  notification.className = 'notification warning';
  notification.innerHTML = `
    <p>⚠️ Low Stock Alert</p>
    <p>Product ${productId} has only ${stockQuantity} items left</p>
    <button onclick="this.parentElement.remove()">Dismiss</button>
  `;
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function playNotificationSound() {
  // Play notification sound for new orders
  const audio = new Audio('/sounds/notification.mp3');
  audio.play().catch(e => console.log('Could not play sound:', e));
}

function handleAuthError() {
  // Clear stored token and redirect to login
  localStorage.removeItem('jwt_token');
  window.location.href = '/login';
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    connectToSocket,
    loginAndConnect,
    reconnectWithStoredToken
  };
}