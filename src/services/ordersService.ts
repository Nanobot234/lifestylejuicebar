import { CartItem, Order, OrderDetails } from "../types";
import { supabase } from "@/integrations/supabase/client";

// Convert a raw Supabase `orders` row (plus its items) into the app's Order type.
const dbToOrderFormat = (dbOrder: any, items: CartItem[] = []): Order => {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    userId: dbOrder.user_id,
    items: items,
    orderDetails: dbOrder.order_details || {},
    total: dbOrder.total_amount,
    status: dbOrder.status,
    createdAt: dbOrder.created_at
  };
};

// Create an order record and its line items for a logged-in customer.
export const createOrder = async (userId: string, items: CartItem[], orderDetails: OrderDetails, total: number): Promise<Order | null> => {
  try {
    // Begin a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_details: orderDetails as any,
        total_amount: total,
        status: "pending",
      } as any)
      .select('*')
      .single();
      
    if (orderError) {
      console.error("Error creating order:", orderError);
      return null;
    }
    
    // After successfully creating the order, create order items
    if (items.length > 0) {
      // Cart IDs may carry a variant suffix (e.g. "<uuid>-16oz"); keep only the product UUID.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
      const orderItemsToInsert = items.map(item => {
        const rawId = String(item.id);
        const productId = rawId.match(UUID_RE)?.[0] ?? rawId;
        return {
          order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          price_at_purchase: item.price,
          special_instructions: productId !== rawId ? item.name : null
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);
        
      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        // Consider rolling back the order here or marking it as failed
        return null;
      }
    }
    
    return dbToOrderFormat(order, items);
  } catch (error) {
    console.error("Error in createOrder:", error);
    return null;
  }
};

// Fetch all orders belonging to a specific customer, including their line items.
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    if (!userId) {
      console.error("No userId provided to getUserOrders");
      return [];
    }
    
    console.log("Fetching orders for user:", userId);
    
    // First, get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (ordersError) {
      console.error("Error fetching user orders:", ordersError);
      return [];
    }
    
    if (!orders || orders.length === 0) {
      return [];
    }
    
    // Now for each order, get the order items
    const result: Order[] = [];
    
    for (const order of orders) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price_at_purchase,
          special_instructions,
          products (*)
        `)
        .eq('order_id', order.id);
        
      if (itemsError) {
        console.error(`Error fetching items for order ${order.id}:`, itemsError);
        result.push(dbToOrderFormat(order, []));
        continue;
      }
      
      // Convert the order items to the CartItem format
      const cartItems: CartItem[] = orderItems.map(item => ({
        id: item.products.id, // Now this works with both string and number types
        name: item.products.name,
        description: item.products.description || '',
        price: item.price_at_purchase,
        image: item.products.image_url || '',
        category: item.products.category || '',
        ingredients: [],  // These fields may not be in the database
        benefits: [],     // These fields may not be in the database
        quantity: item.quantity
      }));
      
      result.push(dbToOrderFormat(order, cartItems));
    }
    
    console.log("Orders retrieved:", result);
    return result;
  } catch (error) {
    console.error("Error in getUserOrders:", error);
    return [];
  }
};

// Fetch every order in the system (used by the business dashboard).
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    // First, get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (ordersError) {
      console.error("Error fetching all orders:", ordersError);
      return [];
    }
    
    if (!orders || orders.length === 0) {
      return [];
    }
    
    // Now for each order, get the order items
    const result: Order[] = [];
    
    for (const order of orders) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price_at_purchase,
          special_instructions,
          products (*)
        `)
        .eq('order_id', order.id);
        
      if (itemsError) {
        console.error(`Error fetching items for order ${order.id}:`, itemsError);
        result.push(dbToOrderFormat(order, []));
        continue;
      }
      
      // Convert the order items to the CartItem format
      const cartItems: CartItem[] = orderItems.map(item => ({
        id: item.products.id,
        name: item.products.name,
        description: item.products.description || '',
        price: item.price_at_purchase,
        image: item.products.image_url || '',
        category: item.products.category || '',
        ingredients: [],  // These fields may not be in the database
        benefits: [],     // These fields may not be in the database
        quantity: item.quantity
      }));
      
      result.push(dbToOrderFormat(order, cartItems));
    }
    
    return result;
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    return [];
  }
};

// Update the status of an order (e.g., pending → preparing → ready → completed).
export const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<Order | null> => {
  try {
    console.log(`Updating order status: Order ID ${orderId} to ${status}`);
    
    // First check if the order exists
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
      
    if (findError) {
      console.error("Error finding order:", findError);
      return null;
    }
    
    if (!existingOrder) {
      console.error(`No order found with id: ${orderId}`);
      return null;
    }
    
    console.log("Found existing order:", existingOrder);
    
    // Update the order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*');
      
    if (error) {
      console.error("Error updating order status:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.error(`Failed to retrieve updated order with id: ${orderId}`);
      return null;
    }
    
    const updatedOrder = data[0]; // Take the first result since we're expecting just one
    console.log("Order updated successfully:", updatedOrder);
    
    // Get the order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price_at_purchase,
        special_instructions,
        products (*)
      `)
      .eq('order_id', orderId);
      
    if (itemsError) {
      console.error(`Error fetching items for order ${orderId}:`, itemsError);
      return dbToOrderFormat(updatedOrder, []);
    }
    
    // Convert the order items to the CartItem format
    const cartItems: CartItem[] = (orderItems || []).map(item => ({
      id: item.products.id,
      name: item.products.name,
      description: item.products.description || '',
      price: item.price_at_purchase,
      image: item.products.image_url || '',
      category: item.products.category || '',
      ingredients: [],  // These fields may not be in the database
      benefits: [],     // These fields may not be in the database
      quantity: item.quantity
    }));
    
    return dbToOrderFormat(updatedOrder, cartItems);
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return null;
  }
};

// Subscribe to realtime Postgres changes for a single order.
export const subscribeToOrderUpdates = (orderId: string, callback: (order: Order) => void) => {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      },
      async (payload) => {
        // When the order is updated, fetch the complete order and notify the callback
        const updatedOrder = await getOrderById(payload.new.id);
        if (updatedOrder) {
          callback(updatedOrder);
        }
      }
    )
    .subscribe();

  // Return the channel so it can be unsubscribed later
  return channel;
};

// Fetch a single order by its UUID, including its line items.
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
    if (error || !order) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
    
    // Get the order items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price_at_purchase,
        special_instructions,
        products (*)
      `)
      .eq('order_id', orderId);
      
    if (itemsError) {
      console.error(`Error fetching items for order ${orderId}:`, itemsError);
      return dbToOrderFormat(order, []);
    }
    
    // Convert the order items to the CartItem format
    const cartItems: CartItem[] = (orderItems || []).map(item => ({
      id: item.products.id,
      name: item.products.name,
      description: item.products.description || '',
      price: item.price_at_purchase,
      image: item.products.image_url || '',
      category: item.products.category || '',
      ingredients: [],
      benefits: [],
      quantity: item.quantity
    }));
    
    return dbToOrderFormat(order, cartItems);
  } catch (error) {
    console.error("Error in getOrderById:", error);
    return null;
  }
};
