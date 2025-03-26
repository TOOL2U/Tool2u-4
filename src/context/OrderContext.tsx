import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from './CartContext';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'delivered' | 'completed' | 'payment_verification';
  orderDate: string;
  customerInfo: CustomerInfo;
  deliveryTime: string;
  estimatedDelivery?: string;
  paymentVerified?: boolean;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderDate' | 'status'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  verifyPayment: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  const addOrder = (orderData: Omit<Order, 'id' | 'orderDate' | 'status'>) => {
    // Calculate estimated delivery date (3 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    
    // Determine initial status based on payment method
    const initialStatus = orderData.paymentMethod === 'cod' 
      ? 'processing' 
      : 'payment_verification';
    
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now().toString().slice(-6)}`,
      orderDate: new Date().toISOString(),
      status: initialStatus,
      estimatedDelivery: deliveryDate.toISOString(),
      paymentVerified: orderData.paymentMethod === 'cod' // COD is automatically verified
    };

    setOrders(prevOrders => [newOrder, ...prevOrders]);
    return newOrder;
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id ? { ...order, status } : order
      )
    );
  };

  const verifyPayment = (id: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id 
          ? { ...order, status: 'processing', paymentVerified: true } 
          : order
      )
    );
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      addOrder, 
      updateOrderStatus, 
      verifyPayment,
      getOrderById
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
