import React, { createContext, useContext, useState } from "react";
import type { StoreId } from "@/lib/stores";

interface Ctx {
  store: StoreId | null;
  setStore: (s: StoreId) => void;
}

const StoreLocationContext = createContext<Ctx>({ store: null, setStore: () => {} });
const KEY = "lifestyle-store";

/** Remembers which store (Bronx/Manhattan) the customer is ordering from. */
export const StoreLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStoreState] = useState<StoreId | null>(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    return v === "bronx" || v === "manhattan" ? v : null;
  });
  const setStore = (s: StoreId) => {
    localStorage.setItem(KEY, s);
    setStoreState(s);
  };
  return <StoreLocationContext.Provider value={{ store, setStore }}>{children}</StoreLocationContext.Provider>;
};

export const useStoreLocation = () => useContext(StoreLocationContext);
