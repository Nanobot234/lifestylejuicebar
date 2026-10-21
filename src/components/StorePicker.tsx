import React from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoreLocation } from "@/context/StoreLocationContext";
import { CLOSED_NOTE, STORES } from "@/lib/stores";

/** Lets customers choose Bronx or Manhattan; smoothie/juice prices depend on it. */
const StorePicker: React.FC = () => {
  const { store, setStore } = useStoreLocation();
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
        {store ? "Ordering from" : "Choose your store to see blend & juice prices"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STORES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStore(s.id)}
            aria-pressed={store === s.id}
            className={cn(
              "text-left rounded-2xl border p-4 transition-colors",
              store === s.id
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:border-foreground"
            )}
          >
            <span className="flex items-center gap-2 font-display tracking-wide">
              <MapPin className="h-4 w-4" /> {s.label.toUpperCase()}
            </span>
            <span className={cn("block text-xs mt-1", store === s.id ? "text-background/80" : "text-muted-foreground")}>
              {s.address}
            </span>
            <span className={cn("block text-xs", store === s.id ? "text-background/80" : "text-muted-foreground")}>
              {s.hours}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{CLOSED_NOTE}</p>
    </div>
  );
};

export default StorePicker;
