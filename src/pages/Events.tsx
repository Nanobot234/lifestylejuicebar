import React, { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Service options shown on the Events landing page.
const SERVICES = [
  {
    title: "SMOOTHIE + ACAI STATIONS",
    copy: "Fresh smoothies and customizable açaí experiences, prepared and served on-site with selections tailored to your event.",
  },
  {
    title: "JUICES + WELLNESS",
    copy: "Cold-pressed juices, wellness shots, refreshers and more.",
  },
  {
    title: "FRESH CATERING",
    copy: "Bowls, overnight oats, toast, fruit and other fresh options customized for your event.",
  },
  {
    title: "WORKPLACE DROPS",
    copy: "Fresh options for meetings, employee appreciation, client visits and team days.",
  },
  {
    title: "STOCK THE FRIDGE",
    copy: "Recurring smoothie, juice and wellness deliveries for your workplace.",
  },
];

const PERFECT_FOR = [
  "Corporate Wellness",
  "Brand Activations",
  "Fitness Events",
  "Private Events",
  "Team Celebrations",
];

const EVENT_TYPES = [
  "Smoothie + Acai Station",
  "Juices + Wellness",
  "Fresh Catering",
  "Workplace Drop",
  "Stock the Fridge",
  "Other / Not Sure Yet",
];

/**
 * Events landing page: service options plus a short inquiry form.
 * Submissions are stored in the event_inquiries table for follow-up.
 */
const Events = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eventType, setEventType] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();

    if (!name || !email) {
      toast.error("Please add your name and email so we can reach you.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("event_inquiries").insert({
      name,
      email,
      phone: String(data.get("phone") || "").trim() || null,
      company: String(data.get("company") || "").trim() || null,
      event_type: eventType || null,
      preferred_date: String(data.get("preferred_date") || "") || null,
      details: String(data.get("details") || "").trim() || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("event inquiry failed", error);
      toast.error("Something went wrong. Please try again or email us directly.");
      return;
    }

    setSubmitted(true);
    toast.success("Thanks! We'll be in touch shortly.");
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="container mx-auto px-4 pt-14 pb-16 text-center">
        <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
          Let's Plan Something
        </span>
        <h1 className="font-display text-4xl md:text-6xl mt-3 mb-6 text-foreground">
          TELL US ABOUT YOUR EVENT.
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Every event is different. Tell us a little about what you're planning, and we'll help create a
          Lifestyle 1104 experience around your needs.
        </p>
      </section>

      {/* Service options */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-muted/40 border border-border rounded-2xl p-7">
              <h2 className="font-display text-base md:text-lg tracking-[0.12em] mb-3 text-foreground">
                {s.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Perfect For</span>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {PERFECT_FOR.map((p) => (
              <span
                key={p}
                className="text-xs tracking-[0.12em] uppercase border border-border rounded-full px-4 py-2 text-foreground"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-2xl mx-auto bg-muted/40 rounded-3xl p-7 md:p-10">
          {submitted ? (
            <div className="text-center py-8">
              <h2 className="font-display text-2xl md:text-3xl mb-4 text-foreground">REQUEST RECEIVED.</h2>
              <p className="text-muted-foreground">
                Thanks for reaching out — our team will follow up soon to plan the details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="(000) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Organization (optional)</Label>
                  <Input id="company" name="company" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event or Service Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger id="event_type">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_date">Preferred Date</Label>
                  <Input id="preferred_date" name="preferred_date" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="details">Tell Us About Your Event</Label>
                <Textarea
                  id="details"
                  name="details"
                  rows={5}
                  placeholder="What are you planning?"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full py-6 tracking-[0.2em] text-xs uppercase"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Let's Plan It <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Events;