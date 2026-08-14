
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import { CartProvider } from "./context/CartContext";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import TrackOrder from "./pages/TrackOrder";
import CustomerDashboard from "./pages/CustomerDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import Contact from "./pages/Contact";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import PromoPopup from "./components/PromoPopup";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// Root component: wraps the app in providers and defines the React Router routes.
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <BrowserRouter>
              <ScrollToTop />
              <PromoPopup />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/login" element={<Login />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                <Route path="/business-dashboard" element={<BusinessDashboard />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/events" element={<Events />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
