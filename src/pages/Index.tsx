import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Leaf, Sparkles, Heart, Droplets, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts } from "@/services/productsService";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { productImageAlt } from "@/lib/imageAlt";
import allSmoothiesImg from "@/assets/all-smoothies.webp";

const Index = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [featuredBowls, setFeaturedBowls] = useState<Product[]>([]);
  const [freshJuices, setFreshJuices] = useState<Product[]>([]);
  const [seaMoss, setSeaMoss] = useState<Product[]>([]);
  const [cleanse, setCleanse] = useState<Product | null>(null);
  const [avocadoToast, setAvocadoToast] = useState<Product | null>(null);
  const [fruitToast, setFruitToast] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts().then((p) => {
      const blends = p.filter((item) => item.category?.includes("blend"));
      const bowls = p.filter((item) => item.category === "bowls");
      setFeatured(blends.slice(0, 3));
      setFeaturedBowls(bowls.slice(0, 3));
      setFreshJuices(p.filter((i) => i.category === "fresh juice").slice(0, 3));
      setSeaMoss(p.filter((i) => i.category === "sea moss"));
      setCleanse(p.find((i) => i.category === "cold pressed juice cleans") ?? null);
      const toasts = p.filter((i) => i.category === "toast");
      setAvocadoToast(toasts.find((t) => /avocado/i.test(t.name)) ?? null);
      setFruitToast(toasts.find((t) => /fruit/i.test(t.name)) ?? null);
    });
  }, []);

  return (
    <Layout>
      {/* Hero — editorial split */}
      <section className="container mx-auto px-4 pt-12 md:pt-20 pb-16 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1">
            <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Est. 2023 — Juice Bar</span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mt-4 mb-6 text-foreground">
              FRESH<br />
              EVERY<br />
              <em className="font-serif italic font-normal text-foreground/70">single sip.</em>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-md mb-8 leading-relaxed">
              Cold-pressed juices and small-batch smoothies, blended with whole, real ingredients. No shortcuts. Just the good stuff.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/menu")}
                className="juice-button bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-[0.2em]"
              >
                See the Menu <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2 relative">
            <div className="aspect-[4/3] md:aspect-[5/4] overflow-hidden rounded-2xl bg-muted">
              <img
                src={allSmoothiesImg}
                alt="Fresh cold-pressed juices and smoothies on a table at a New York City juice bar — Lifestyle 1104"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 bg-background border border-border px-5 py-3 rounded-full shadow-sm">
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">100% Real</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee-style values */}
      <section className="border-y border-border bg-muted/40 py-6 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-wrap justify-around gap-y-3 items-center text-foreground">
          {["Cold-Pressed", "Whole Ingredients", "No Added Sugar", "Made Daily", "Locally Sourced"].map((t) => (
            <span key={t} className="font-display text-sm md:text-base tracking-[0.3em]">
              ✦ {t.toUpperCase()}
            </span>
          ))}
        </div>
      </section>

      {/* Brand introduction — the approved "It's Really a Lifestyle." copy */}
      <section className="container mx-auto px-4 py-20 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-8 text-foreground">
            IT'S REALLY A LIFESTYLE.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Lifestyle 1104 was created with a simple mission: to make healthier choices feel accessible,
            enjoyable and realistic for everyday life. We believe wellness doesn't have to be all or nothing.
            Wherever you are in your journey, there's a place to start.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            From smoothies and fresh juices to nourishing bowls and wellness favorites, we focus on quality
            ingredients, great taste and options people can actually enjoy — without making a healthier
            lifestyle feel complicated or out of reach.
          </p>
          <p className="font-display text-sm md:text-base tracking-[0.3em] uppercase text-foreground">
            Eat well. Drink well. Live well.
          </p>
        </div>
      </section>

      {/* Juice Cleanse — feature spotlight */}
      {cleanse && (
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center bg-muted/40 rounded-3xl p-6 md:p-12">
            <div className="relative">
              <div className="aspect-square md:aspect-[4/5] overflow-hidden rounded-2xl bg-background flex items-center justify-center">
                <img
                  src={cleanse.image}
                  alt={productImageAlt(cleanse.name, cleanse.category)}
                  loading="lazy"
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </div>
            <div>
              <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Reset & Restore</span>
              <h2 className="font-display text-4xl md:text-5xl mt-2 mb-4 text-foreground">JUICE CLEANSE</h2>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
                Six numbered cold-pressed juices, sipped in order throughout the day to flush, hydrate, and re-energize. Choose 1, 3, or 7 days.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <Droplets className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground">Hydrate</p>
                    <p className="text-xs text-muted-foreground mt-1">Whole-fruit hydration all day.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground">Energize</p>
                    <p className="text-xs text-muted-foreground mt-1">Clean vitamins, no caffeine crash.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground">Reset</p>
                    <p className="text-xs text-muted-foreground mt-1">Give your system a soft reboot.</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/menu?category=cold%20pressed%20juice%20cleans")}
                className="juice-button bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-[0.2em]"
              >
                View Juice Cleanse <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Sea Moss */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Shippable Nationwide</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">SEA MOSS</h2>
          </div>
          <Button
            onClick={() => navigate("/menu?category=sea%20moss")}
            variant="ghost"
            className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
          >
            View Sea Moss <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {seaMoss.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Acai Bowls */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">The Lineup</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">ACAI BOWLS</h2>
          </div>
          <Button
            onClick={() => navigate("/menu?category=bowls")}
            variant="ghost"
            className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
          >
            View Acai Bowls <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {featuredBowls.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Fresh Juices */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Made To Order</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">JUICES</h2>
          </div>
          <Button
            onClick={() => navigate("/menu?category=fresh%20juice")}
            variant="ghost"
            className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
          >
            View Juices <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {freshJuices.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Signature Blends */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">The Lineup</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">SIGNATURE BLENDS</h2>
          </div>
          <Button
            onClick={() => navigate("/menu?category=superfood%20blends")}
            variant="ghost"
            className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
          >
            View Signature Blends <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Avocado Toast */}
      {avocadoToast && (
        <section className="container mx-auto px-4 py-20 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Fresh Off The Press</span>
              <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">AVOCADO TOAST</h2>
            </div>
            <Button
              onClick={() => navigate("/menu?category=toast")}
              variant="ghost"
              className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
            >
              View Toasts <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <ProductCard product={avocadoToast} />
          </div>
        </section>
      )}

      {/* Fruit Toast */}
      {fruitToast && (
        <section className="container mx-auto px-4 py-20 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Fresh Off The Press</span>
              <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">FRUIT TOAST</h2>
            </div>
            <Button
              onClick={() => navigate("/menu?category=toast")}
              variant="ghost"
              className="self-start md:self-auto uppercase text-xs tracking-[0.2em] text-foreground hover:bg-transparent hover:underline"
            >
              View Toasts <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <ProductCard product={fruitToast} />
          </div>
        </section>
      )}

      {/* Events + Corporate Wellness CTA — intentionally later in the homepage flow */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="bg-muted/40 rounded-3xl p-8 md:p-14 text-center">
          <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">
            Events + Corporate Wellness
          </span>
          <h2 className="font-display text-3xl md:text-5xl mt-3 mb-5 text-foreground">
            BRING LIFESTYLE TO YOUR NEXT EVENT
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
            From workplace wellness and corporate events to pop-ups and private celebrations, we bring
            fresh, feel-good options directly to you.
          </p>
          <Button
            onClick={() => navigate("/events")}
            className="juice-button bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-[0.2em]"
          >
            Plan Your Event <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="mt-10 overflow-hidden rounded-2xl">
            <img
              src={eventStation}
              alt="Lifestyle 1104 smoothie station with branded table and colorful smoothies at a corporate event in New York City"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-foreground text-background py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[11px] tracking-[0.35em] text-background/60 uppercase">The Philosophy</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 mb-6">A LIFESTYLE,<br /><em className="italic font-serif font-normal text-background/80">not a trend.</em></h2>
            <p className="text-background/70 leading-relaxed mb-6">
              Lifestyle 1104 was built on a simple idea: feeling good shouldn't be complicated. Every cup is crafted with intention — real fruit, real vegetables, real nutrition.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div>
                <Leaf className="h-6 w-6 mb-3 text-background/80" />
                <p className="text-xs tracking-[0.15em] uppercase text-background/60">Whole<br />Ingredients</p>
              </div>
              <div>
                <Sparkles className="h-6 w-6 mb-3 text-background/80" />
                <p className="text-xs tracking-[0.15em] uppercase text-background/60">Cold<br />Pressed</p>
              </div>
              <div>
                <Heart className="h-6 w-6 mb-3 text-background/80" />
                <p className="text-xs tracking-[0.15em] uppercase text-background/60">Made<br />With Love</p>
              </div>
            </div>
          </div>
          <div>
            <span className="text-[11px] tracking-[0.35em] text-background/60 uppercase">Why It Matters</span>
            <h3 className="font-display text-3xl md:text-4xl mt-2 mb-8">REAL FOOD.<br />REAL RESULTS.</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-background/5 border border-background/15 p-6 rounded-2xl">
                <h4 className="font-display text-base mb-2 tracking-wide">ENERGY</h4>
                <p className="text-background/70 text-sm leading-relaxed">
                  Fresh juices provide an instant boost of vitamins and minerals that help fight fatigue and increase your energy levels naturally.
                </p>
              </div>
              <div className="bg-background/5 border border-background/15 p-6 rounded-2xl">
                <h4 className="font-display text-base mb-2 tracking-wide">DIGESTION</h4>
                <p className="text-background/70 text-sm leading-relaxed">
                  The enzymes in fresh juice aid digestion and help your body absorb nutrients more effectively.
                </p>
              </div>
              <div className="bg-background/5 border border-background/15 p-6 rounded-2xl">
                <h4 className="font-display text-base mb-2 tracking-wide">GLOW</h4>
                <p className="text-background/70 text-sm leading-relaxed">
                  Antioxidants in fresh juices help combat free radicals, leading to clearer, more radiant skin.
                </p>
              </div>
              <div className="bg-background/5 border border-background/15 p-6 rounded-2xl">
                <h4 className="font-display text-base mb-2 tracking-wide">IMMUNITY</h4>
                <p className="text-background/70 text-sm leading-relaxed">
                  Regular consumption of fresh juices strengthens your immune system and helps your body fight off illnesses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">Ready?</span>
        <h2 className="font-display text-4xl md:text-6xl mt-3 mb-6 text-foreground">SIP THE DIFFERENCE.</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">Order ahead for pickup or delivery. Your daily glow is one tap away.</p>
        <Button
          onClick={() => navigate("/menu")}
          className="juice-button bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-[0.2em]"
        >
          Start Your Order <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </Layout>
  );
};

export default Index;
