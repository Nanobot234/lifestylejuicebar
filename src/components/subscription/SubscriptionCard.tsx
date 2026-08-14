
import React from "react";
import { format, parseISO } from "date-fns";
import { UserSubscription } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { updateSubscriptionStatus } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, PauseCircle, PlayCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";

interface SubscriptionCardProps {
  subscription: UserSubscription;
  onRefresh: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onRefresh }) => {
  const handleStatusUpdate = async (status: "active" | "paused" | "cancelled") => {
    const success = await updateSubscriptionStatus(subscription.id, status);
    if (success) {
      onRefresh();
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      
      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe Customer Portal in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error("Error opening subscription management. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 hover:bg-green-600";
      case "paused":
        return "bg-amber-500 hover:bg-amber-600";
      case "cancelled":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-grow">
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">{subscription.plan?.name}</h3>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2 text-gray-600">
          <p>
            <span className="font-semibold">Price:</span> ${subscription.plan?.price.toFixed(2)}/{subscription.plan?.frequency}
          </p>
          <p>
            <span className="font-semibold">Started:</span> {format(parseISO(subscription.started_at), "PP")}
          </p>
          <p className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span className="font-semibold">Next Delivery:</span> {format(parseISO(subscription.next_delivery_date), "PP")}
          </p>
          <p>
            <span className="font-semibold">Address:</span> {subscription.shipping_address}
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex flex-col gap-2">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleManageSubscription}
        >
          <Settings className="mr-1 h-4 w-4" /> Manage with Stripe
        </Button>
        
        <div className="flex gap-2 w-full">
          {subscription.status === "active" && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleStatusUpdate("paused")}
            >
              <PauseCircle className="mr-1 h-4 w-4" /> Pause
            </Button>
          )}
          {subscription.status === "paused" && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleStatusUpdate("active")}
            >
              <PlayCircle className="mr-1 h-4 w-4" /> Resume
            </Button>
          )}
          {(subscription.status === "active" || subscription.status === "paused") && (
            <Button 
              variant="outline" 
              className="flex-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleStatusUpdate("cancelled")}
            >
              <XCircle className="mr-1 h-4 w-4" /> Cancel
            </Button>
          )}
          {subscription.status === "cancelled" && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleStatusUpdate("active")}
            >
              <PlayCircle className="mr-1 h-4 w-4" /> Reactivate
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionCard;
