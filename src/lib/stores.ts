/** Store locations, hours, and location-based pricing/availability rules. */
export type StoreId = "bronx" | "manhattan";

export interface StoreInfo {
  id: StoreId;
  label: string;
  address: string;
  hours: string;
}

export const STORES: StoreInfo[] = [
  { id: "bronx", label: "Bronx", address: "6 E. 167th St., Bronx, NY", hours: "Mon–Sat 8 a.m.–8 p.m." },
  { id: "manhattan", label: "Manhattan", address: "411 W. 35th St., New York, NY", hours: "Mon–Sat 8 a.m.–7 p.m." },
];

export const CLOSED_NOTE = "Closed Sundays";

/** Smoothies and juices can be priced differently per store. */
const LOCATION_PRICED = ["superfood blends", "protein blends", "fresh juice", "cold-pressed juice"];

export function isLocationPriced(category: string): boolean {
  return LOCATION_PRICED.includes(category);
}

export interface LocationProductFields {
  category: string;
  price: number;
  priceBronx?: number | null;
  priceManhattan?: number | null;
  soldOutBronx?: boolean;
  soldOutManhattan?: boolean;
}

/** Price at a store; null means "choose a store first" for smoothies/juices. */
export function priceForStore(p: LocationProductFields, store: StoreId | null): number | null {
  if (!isLocationPriced(p.category)) return p.price;
  if (!store) return null;
  const override = store === "bronx" ? p.priceBronx : p.priceManhattan;
  return override ?? p.price;
}

/** Sold out at the chosen store, or at both stores when none is chosen. */
export function isSoldOut(p: LocationProductFields, store: StoreId | null): boolean {
  if (store === "bronx") return !!p.soldOutBronx;
  if (store === "manhattan") return !!p.soldOutManhattan;
  return !!p.soldOutBronx && !!p.soldOutManhattan;
}
