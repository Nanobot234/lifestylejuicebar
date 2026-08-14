
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryMethod, PaymentMethod } from "@/types";
import { toast } from "sonner";
import { calculateShipping, hasShippableItems, US_STATES } from "@/lib/shipping";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";

// Store locations shown on the checkout pickup selector with Google Maps directions.
const PICKUP_LOCATIONS = [
  {
    id: "bronx",
    label: "Bronx",
    address: "6 E. 167th St., Bronx, NY",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("6 E. 167th St., Bronx, NY"),
  },
  {
    id: "manhattan",
    label: "Manhattan",
    address: "411 W. 35th St., New York, NY",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("411 W. 35th St., New York, NY"),
  },
];

// Zod schema for checkout form validation. Address fields are required only for shipping.
const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "delivery", "shipping"]),
  pickupLocation: z.string().optional(),
  paymentMethod: z.enum(["card"]), // Only card payments through Stripe
  notes: z.string().optional(),
});

const Checkout = () => {
  const { cartItems, total, clearCart } = useCart();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cartHasShippable = hasShippableItems(cartItems);

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/menu");
      return;
    }
  }, [cartItems.length, navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.name || "",
      phone: currentUser?.phone || "",
      email: currentUser?.email || "",
      address: "",
      city: "",
      state: "",
      zip: "",
      deliveryMethod: cartHasShippable ? "shipping" : "pickup",
      pickupLocation: "bronx",
      paymentMethod: "card",
      notes: "",
    },
  });

  const deliveryMethod = form.watch("deliveryMethod");
  const shipState = form.watch("state");
  const pickupLocationId = form.watch("pickupLocation");
  const selectedPickup = PICKUP_LOCATIONS.find((l) => l.id === pickupLocationId);

  // Validate the form, build the order details, and redirect the customer to Stripe Checkout.
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields for delivery
      if (values.deliveryMethod === "delivery" && (!values.address || values.address.trim() === "")) {
        toast.error("Please provide a delivery address");
        setIsSubmitting(false);
        return;
      }
      if (values.deliveryMethod === "shipping") {
        if (!values.address || !values.city || !values.state || !values.zip) {
          toast.error("Please provide a complete shipping address (street, city, state, zip)");
          setIsSubmitting(false);
          return;
        }
      }
      if (values.deliveryMethod === "pickup" && !values.pickupLocation) {
        toast.error("Please select a pickup location");
        setIsSubmitting(false);
        return;
      }
      
      const orderDetails = {
        name: values.name,
        phone: values.phone,
        email: values.email,
        address:
          values.deliveryMethod === "shipping"
            ? `${values.address}, ${values.city}, ${values.state} ${values.zip}`
            : values.deliveryMethod === "pickup"
            ? PICKUP_LOCATIONS.find((l) => l.id === values.pickupLocation)?.address
            : values.address,
        deliveryMethod: values.deliveryMethod as DeliveryMethod,
        paymentMethod: values.paymentMethod as PaymentMethod,
        notes: values.notes,
      };

      const subtotal = total;
      const tax = subtotal * 0.08;
      const localDeliveryFee = values.deliveryMethod === "delivery" ? 3.99 : 0;
      const shippingFee =
        values.deliveryMethod === "shipping"
          ? calculateShipping(cartItems, values.state)
          : 0;
      const totalWithFees = subtotal + tax + localDeliveryFee + shippingFee;
      
      // Persist order info so we can create the order record after Stripe returns
      sessionStorage.setItem("orderDetails", JSON.stringify(orderDetails));
      sessionStorage.setItem("orderItems", JSON.stringify(cartItems));
      sessionStorage.setItem("orderTotal", String(totalWithFees));

      // Create Stripe payment session
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items: cartItems,
          orderDetails,
          total: totalWithFees,
          deliveryFee: localDeliveryFee + shippingFee,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error processing your payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recalculate order totals live as the user changes delivery method or state.
  const subtotal = total;
  const tax = subtotal * 0.08;
  const localDeliveryFee = deliveryMethod === "delivery" ? 3.99 : 0;
  const shippingFee =
    deliveryMethod === "shipping" ? calculateShipping(cartItems, shipState) : 0;
  const totalWithFees = subtotal + tax + localDeliveryFee + shippingFee;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fulfillment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-wrap gap-4"
                          >
                            {!cartHasShippable && (
                              <>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="pickup" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    PICKUP — order ahead, grab in store
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="delivery" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    LOCAL DELIVERY (+$3.99)
                                  </FormLabel>
                                </FormItem>
                              </>
                            )}
                            {cartHasShippable && (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="shipping" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  SHIPPING — ship to my address
                                </FormLabel>
                              </FormItem>
                            )}
                          </RadioGroup>
                        </FormControl>
                        {cartHasShippable && (
                          <div className="text-xs text-muted-foreground mt-2 space-y-2">
                            <p>
                              Your cart includes a shippable item (Juice Cleanse or Sea Moss). Shipping is
                              calculated from your delivery address and the package weight/service required.
                              For fresh juices, blends, bowls or toast, place a separate pickup or local
                              delivery order.
                            </p>
                            <p>
                              <strong>Processing time is separate from shipping/transit time.</strong> Juice
                              Cleanse orders need 3–5 business days to prepare; Sea Moss needs 2 business days
                              before it ships.
                            </p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {deliveryMethod === "delivery" && (
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your full address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {deliveryMethod === "pickup" && (
                    <FormField
                      control={form.control}
                      name="pickupLocation"
                      render={({ field }) => (
                        <FormItem className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                          <FormLabel>Pickup Location</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              {PICKUP_LOCATIONS.map((loc) => (
                                <div
                                  key={loc.id}
                                  className="flex items-start justify-between gap-3 p-3 bg-white rounded-md border"
                                >
                                  <div className="flex items-start space-x-3">
                                    <RadioGroupItem value={loc.id} id={`pickup-${loc.id}`} className="mt-1" />
                                    <label
                                      htmlFor={`pickup-${loc.id}`}
                                      className="cursor-pointer"
                                    >
                                      <div className="font-medium">{loc.label}</div>
                                      <div className="text-sm text-muted-foreground">📍 {loc.address}</div>
                                    </label>
                                  </div>
                                  <a
                                    href={loc.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-juicy-green hover:underline whitespace-nowrap"
                                  >
                                    Directions →
                                  </a>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {deliveryMethod === "shipping" && (
                    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                      <h3 className="font-semibold">Shipping Address</h3>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Brooklyn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {US_STATES.map((s) => (
                                    <SelectItem key={s.code} value={s.code}>
                                      {s.code} — {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="zip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP</FormLabel>
                              <FormControl>
                                <Input placeholder="11201" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Special requests, allergies, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Payment Method</h3>
                    <p className="text-blue-700">Secure payment with Stripe (Credit/Debit Cards)</p>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto bg-juicy-green hover:bg-juicy-green/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Pay with Stripe"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.quantity}x</span> {item.name}
                    </div>
                    <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {deliveryMethod === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>${localDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {deliveryMethod === "shipping" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Shipping{shipState ? ` (${shipState})` : ""}
                    </span>
                    <span>
                      {shippingFee === 0 && shipState ? "FREE" : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>${totalWithFees.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
