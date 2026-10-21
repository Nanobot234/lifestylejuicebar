
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Mail, Instagram, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const LOCATIONS = [
  {
    label: "6 E. 167th St., Bronx, NY",
    hours: "Mon–Sat 8 a.m.–8 p.m.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=6+E+167th+St,+Bronx,+NY",
  },
  {
    label: "411 W. 35th St., New York, NY",
    hours: "Mon–Sat 8 a.m.–7 p.m.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=411+W+35th+St,+New+York,+NY",
  },
];

const INSTAGRAM_URL = "https://www.instagram.com/lifestyle1104juicebar";
const EMAIL = "lifestyle1104juicebar@gmail.com";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const subject = encodeURIComponent(values.subject);
      const body = encodeURIComponent(
        `Name: ${values.name}\nEmail: ${values.email}\n\n${values.message}`
      );
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      toast.success("Opening your email app to send the message.");
      form.reset();
    } catch (error) {
      toast.error("Failed to open email app. Please try again.");
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-muted/40 border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
            Get in Touch
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl mt-4 mb-6 text-foreground">
            CONTACT US
          </h1>
          <p className="max-w-xl mx-auto text-muted-foreground text-base md:text-lg leading-relaxed">
            Have questions, suggestions, or want to place a large order? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <div className="border border-border rounded-2xl bg-card p-8 h-full">
              <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
                The Details
              </span>
              <h2 className="font-display text-3xl md:text-4xl mt-2 mb-8 text-foreground">
                GET IN TOUCH
              </h2>

              <div className="space-y-8">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-foreground mr-4 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-display text-sm tracking-[0.2em] uppercase text-foreground mb-3">
                      Visit Us
                    </h3>
                    <div className="space-y-2">
                      {LOCATIONS.map((location) => (
                        <div key={location.label}>
                          <a
                            href={location.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 text-sm"
                          >
                            {location.label}
                          </a>
                          <p className="text-xs text-muted-foreground">{location.hours}</p>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground">Closed Sundays</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-foreground mr-4 mt-1 shrink-0" />
                  <div>
                    <h3 className="font-display text-sm tracking-[0.2em] uppercase text-foreground mb-2">
                      Email Us
                    </h3>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 text-sm"
                    >
                      {EMAIL}
                    </a>
                    <p className="text-muted-foreground/70 text-xs mt-1">
                      We&apos;ll respond within 24 hours
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-sm tracking-[0.2em] uppercase text-foreground mb-4">
                    Follow Us
                  </h3>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-border text-foreground hover:bg-foreground hover:text-background transition-colors text-xs tracking-[0.15em] uppercase"
                  >
                    <Instagram className="h-4 w-4" />
                    @lifestyle1104juicebar
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="border border-border rounded-2xl bg-card p-8">
              <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
                Send a Note
              </span>
              <h2 className="font-display text-3xl md:text-4xl mt-2 mb-8 text-foreground">
                SEND US A MESSAGE
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                            Your Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                          Subject
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="How can we help you?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                          Message
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your inquiry..."
                            className="min-h-[140px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 tracking-[0.15em] text-xs uppercase"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;

