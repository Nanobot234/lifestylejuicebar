
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getSubscriptionPlans } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";

interface SubscriptionFormProps {
  items: CartItem[];
  onSuccess?: () => void;
}

interface FormValues {
  planId: string;
  address: string;
  deliveryDate: Date;
  frequency: "weekly" | "bi-weekly" | "monthly";
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ items, onSuccess }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutBody, setCheckoutBody] = useState<Record<string, unknown> | null>(null);
  const { currentUser } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    defaultValues: {
      planId: "",
      address: "",
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to one week from now
      frequency: "weekly",
    },
  });

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const subscriptionPlans = await getSubscriptionPlans();
      setPlans(subscriptionPlans);
      
      // Set default plan if available
      if (subscriptionPlans.length > 0) {
        form.setValue("planId", subscriptionPlans[0].id);
      }
      
      setIsLoading(false);
    };

    fetchPlans();
  }, [form]);

  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      toast.error("You must be logged in to create a subscription");
      navigate("/login");
      return;
    }

    if (!values.address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    // Keep the subscription details so they can be applied after payment.
    sessionStorage.setItem("pendingSubscription", JSON.stringify({
      planId: values.planId,
      address: values.address,
      deliveryDate: values.deliveryDate.toISOString(),
      items,
    }));

    // Show Stripe's embedded checkout for the recurring charge.
    setCheckoutBody({
      amount: Number(totalWithDelivery.toFixed(2)),
      frequency: values.frequency,
    });
  };

  const itemsTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = 3.99;
  const totalWithDelivery = itemsTotal + deliveryFee;

  if (isLoading && plans.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-juicy-green" />
      </div>
    );
  }

  if (checkoutBody) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Subscription</h2>
        <StripeEmbeddedCheckout
          functionName="create-recurring-checkout"
          body={checkoutBody}
          returnUrl={`${window.location.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`}
        />
        <Button variant="outline" className="mt-6" onClick={() => setCheckoutBody(null)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Subscription</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Frequency</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly - ${totalWithDelivery.toFixed(2)}/week</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly - ${totalWithDelivery.toFixed(2)}/2 weeks</SelectItem>
                    <SelectItem value="monthly">Monthly - ${totalWithDelivery.toFixed(2)}/month</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your delivery address" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>First Delivery Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <h3 className="text-lg font-semibold mb-3">Items in Subscription</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total per delivery</span>
                <span>${totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Payment Method</h3>
            <p className="text-blue-700">Secure recurring payment with Stripe</p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-juicy-green hover:bg-juicy-green/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processing...
              </>
            ) : (
              "Subscribe with Stripe"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SubscriptionForm;
