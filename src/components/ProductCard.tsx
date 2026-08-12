
import React, { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

type JuiceSize = "16oz" | "24oz";
const SIZE_UPCHARGE: Record<JuiceSize, number> = { "16oz": 0, "24oz": 2 };

type CleanseDays = "1 Day" | "3 Day" | "7 Day";
const CLEANSE_PRICE: Record<CleanseDays, number> = { "1 Day": 50, "3 Day": 130, "7 Day": 250 };

const BOWL_TOPPINGS = {
  Fruit: ["Banana", "Strawberries", "Blueberries", "Mango", "Kiwi", "Raspberries", "Blackberries"],
  Superfood: ["Chia Seeds", "Flax Seeds", "Hemp Seeds"],
  Crunch: ["Granola", "Almonds", "Coconut Flakes", "Cacao Nibs", "Chocolate Chips"],
};
const BOWL_DRIZZLES = ["Agave", "Almond Butter", "Caramel", "Honey", "Nutella", "Peanut Butter"];

interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { addToCart } = useCart();

  // Determine which customization UI this product needs based on category.
  const hasSizes =
    product.category === "fresh juice" ||
    product.category === "superfood blends" ||
    product.category === "protein blends";
  const isColdPressed = product.category === "cold-pressed juice";
  const isBowl = product.category === "bowls";
  const isCleanse = product.category === "cold pressed juice cleans";
  const isSeaMoss = product.category === "sea moss";

  // Local state for size, cleanse duration, and bowl customizations.
  const [size, setSize] = useState<JuiceSize>("16oz");
  const [cleanseDays, setCleanseDays] = useState<CleanseDays>("1 Day");
  const [toppings, setToppings] = useState<string[]>([]);
  const [drizzles, setDrizzles] = useState<string[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Calculate the price shown to the user, accounting for size/cleanse options.
  const displayPrice = hasSizes
    ? product.price + SIZE_UPCHARGE[size]
    : isCleanse
    ? CLEANSE_PRICE[cleanseDays]
    : product.price;

  // Toggle a bowl topping or drizzle in/out of a selected list.
  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  // Build the final cart item (with customizations) and add it to the cart.
  const handleAddToCart = () => {
    if (hasSizes) {
      addToCart({
        ...product,
        id: `${product.id}-${size}`,
        name: `${product.name} (${size})`,
        price: product.price + SIZE_UPCHARGE[size],
      });
    } else if (isCleanse) {
      const cleansePrice = CLEANSE_PRICE[cleanseDays];
      addToCart({
        ...product,
        id: `${product.id}-${cleanseDays.replace(" ", "")}`,
        name: `${product.name} (${cleanseDays})`,
        price: cleansePrice,
      });
    } else if (isBowl) {
      const addOns = [...toppings, ...drizzles];
      const suffix = addOns.length > 0 ? ` + ${addOns.join(", ")}` : "";
      const idSuffix = addOns.length > 0 ? `-${addOns.join("-").toLowerCase().replace(/\s+/g, "")}` : "";
      addToCart({
        ...product,
        id: `${product.id}${idSuffix}`,
        name: `${product.name}${suffix}`,
      });
      setToppings([]);
      setDrizzles([]);
      setCustomizeOpen(false);
    } else {
      addToCart(product);
    }
  };

  return (
    <Card className={cn("juice-card h-full flex flex-col group border-0 shadow-none bg-transparent", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className={cn(
            "w-full h-full object-center transform group-hover:scale-105 transition-transform duration-700",
            isCleanse ? "object-contain p-4" : "object-cover"
          )}
        />
        <span className="absolute top-3 left-3 text-[10px] tracking-[0.25em] uppercase bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full">
          {product.category}
        </span>
      </div>
      <CardContent className="pt-5 px-1 flex-grow">
        <div className="flex justify-between items-baseline mb-2 gap-3">
          <h3 className="font-display text-xl tracking-wide text-foreground">{product.name.toUpperCase()}</h3>
          <span className="font-medium text-foreground whitespace-nowrap">${displayPrice.toFixed(2)}</span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
        {hasSizes && (
          <div className="mt-4 flex gap-2">
            {(["16oz", "24oz"] as JuiceSize[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "flex-1 text-xs tracking-[0.15em] uppercase py-2 rounded-full border transition-colors",
                  size === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {isColdPressed && (
          <p className="mt-4 text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            16 oz bottle
          </p>
        )}
        {isCleanse && (
          <div className="mt-4 flex gap-2">
            {(["1 Day", "3 Day", "7 Day"] as CleanseDays[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setCleanseDays(d)}
                className={cn(
                  "flex-1 text-xs tracking-[0.15em] uppercase py-2 rounded-full border transition-colors",
                  cleanseDays === d
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-border hover:border-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        {/* Processing notices shown near purchase controls for made-fresh shippable products */}
        {isCleanse && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Freshly pressed for your order.</span>{" "}
            Please allow <strong>3–5 business days for processing</strong> before your order is ready for
            pickup, local delivery or shipment. Processing time is separate from shipping/transit time —
            we recommend ordering ahead of the date you'd like to begin.
          </p>
        )}
        {isSeaMoss && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Made fresh for your order.</span>{" "}
            Please allow <strong>2 business days for processing</strong> before your order ships.
            Processing time is separate from shipping/transit time.
          </p>
        )}
        {isBowl && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setCustomizeOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs tracking-[0.15em] uppercase py-2 px-4 rounded-full border border-border hover:border-foreground transition-colors"
            >
              <span>
                Customize{toppings.length + drizzles.length > 0 ? ` · ${toppings.length + drizzles.length}` : ""}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", customizeOpen && "rotate-180")} />
            </button>
            {customizeOpen && (
              <div className="mt-3 space-y-4">
                {Object.entries(BOWL_TOPPINGS).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">{group}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggle(toppings, setToppings, item)}
                          className={cn(
                            "text-[11px] px-3 py-1 rounded-full border transition-colors",
                            toppings.includes(item)
                              ? "bg-foreground text-background border-foreground"
                              : "bg-transparent text-foreground border-border hover:border-foreground"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Drizzles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BOWL_DRIZZLES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggle(drizzles, setDrizzles, item)}
                        className={cn(
                          "text-[11px] px-3 py-1 rounded-full border transition-colors",
                          drizzles.includes(item)
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-foreground border-border hover:border-foreground"
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-4 px-1">
        <Button 
          onClick={handleAddToCart} 
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full py-6 tracking-[0.15em] text-xs uppercase"
        >
          <Plus className="mr-2 h-4 w-4" /> Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
