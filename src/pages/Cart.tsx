import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import { productImageAlt } from "@/lib/imageAlt";
import { Trash2, ArrowRight, RefreshCw } from "lucide-react";
import SubscriptionForm from "@/components/subscription/SubscriptionForm";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

const Cart = () => {
  const { cartItems, total, updateCartItemQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("oneTime");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if cart is empty
  const isCartEmpty = cartItems.length === 0;
  
  // Use the total directly from context
  const cartTotal = total;

  // Handle checkout button click — guests are allowed
  const handleCheckout = () => {
    navigate("/checkout");
  };

  // Handle subscription success
  const handleSubscriptionSuccess = () => {
    navigate("/customer-dashboard");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        
        {isCartEmpty ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <Button onClick={() => navigate("/menu")}>
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 border-b last:border-0"
                  >
                    <div className="flex items-center">
                      <img
                        src={item.image}
                        alt={productImageAlt(item.name, item.category)}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                      <div>
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 text-sm">${item.price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center border rounded-md mr-4">
                        <button
                          onClick={() =>
                            updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 text-right font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={clearCart} 
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Clear Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/menu")}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Tabs defaultValue="oneTime" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="oneTime" className="flex-1">One-time Order</TabsTrigger>
                  <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
                </TabsList>
                
                <TabsContent value="oneTime">
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-gray-600">
                          <span>{item.quantity}x {item.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t my-4 pt-4">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleCheckout}
                      className="w-full mt-4 bg-juicy-green hover:bg-juicy-green/90"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    {!isAuthenticated && (
                      <p className="text-xs text-center text-gray-500 mt-3">
                        Checking out as guest.{" "}
                        <button
                          type="button"
                          onClick={() => navigate("/login", { state: { from: "/cart" } })}
                          className="underline hover:text-juicy-green"
                        >
                          Sign in
                        </button>{" "}
                        to save your order history.
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="subscription">
                  <SubscriptionForm 
                    items={cartItems}
                    onSuccess={handleSubscriptionSuccess}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
