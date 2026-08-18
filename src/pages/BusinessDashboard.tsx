
import React from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinessDashboard } from "@/hooks/useBusinessDashboard";

// Dashboard components
import DashboardCards from "@/components/business/dashboard/DashboardCards";
import ActiveOrdersTab from "@/components/business/dashboard/ActiveOrdersTab";
import CompletedOrdersTab from "@/components/business/dashboard/CompletedOrdersTab";
import ProductManagementTab from "@/components/business/dashboard/ProductManagementTab";
import BusinessSettingsTab from "@/components/business/dashboard/BusinessSettingsTab";
import SubscriptionsTab from "@/components/business/dashboard/SubscriptionsTab";
import PayoutsTab from "@/components/business/dashboard/PayoutsTab";

const BusinessDashboard = () => {
  const { isAuthenticated, isBusinessOwner } = useAuth();
  const {
    activeTab,
    setActiveTab,
    activeOrders,
    completedOrders,
    handleStatusChange,
    handleRefresh,
    loadingOrders,
    orders
  } = useBusinessDashboard();

  // Redirect if not authenticated or not a business owner
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isBusinessOwner) {
    return <Navigate to="/" />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Business Dashboard</h1>

        {/* Dashboard Summary Cards */}
        <DashboardCards orders={orders} />

        {/* Dashboard Tabs */}
        <div className="mt-8">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="bg-white rounded-xl shadow-md mb-6"
          >
            <div className="px-6 pt-6">
              <TabsList className="w-full">
                <TabsTrigger value="orders" className="flex-1">Active Orders</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">Order History</TabsTrigger>
                <TabsTrigger value="products" className="flex-1">Products</TabsTrigger>
                <TabsTrigger value="subscriptions" className="flex-1">Subscriptions</TabsTrigger>
                <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="orders" className="p-0">
              <ActiveOrdersTab
                orders={activeOrders}
                onStatusChange={handleStatusChange}
                handleRefresh={handleRefresh}
                isLoading={loadingOrders}
              />
            </TabsContent>
            
            <TabsContent value="history" className="p-0">
              <CompletedOrdersTab 
                orders={completedOrders}
                onStatusChange={handleStatusChange}
                handleRefresh={handleRefresh}
                isLoading={loadingOrders}
              />
            </TabsContent>
            
            <TabsContent value="products" className="p-0">
              <ProductManagementTab />
            </TabsContent>
            
            <TabsContent value="subscriptions" className="p-0">
              <SubscriptionsTab />
            </TabsContent>

            <TabsContent value="payouts" className="p-0">
              <PayoutsTab />
            </TabsContent>
            
            <TabsContent value="settings" className="p-0">
              <BusinessSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessDashboard;
