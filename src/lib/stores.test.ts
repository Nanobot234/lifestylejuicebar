/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { isSoldOut, priceForStore } from "./stores";

describe("store pricing", () => {
  test("smoothies and juices hide price until a store is chosen", () => {
    expect(priceForStore({ category: "fresh juice", price: 10 }, null)).toBeNull();
    expect(priceForStore({ category: "superfood blends", price: 10, priceManhattan: 12 }, "manhattan")).toBe(12);
    expect(priceForStore({ category: "protein blends", price: 10, priceManhattan: 12 }, "bronx")).toBe(10);
  });
  test("other items show the same price everywhere", () => {
    expect(priceForStore({ category: "sea moss", price: 25 }, null)).toBe(25);
  });
  test("sold out is tracked per store", () => {
    const p = { category: "bowls", price: 13, soldOutBronx: true, soldOutManhattan: false };
    expect(isSoldOut(p, "bronx")).toBe(true);
    expect(isSoldOut(p, "manhattan")).toBe(false);
    expect(isSoldOut(p, null)).toBe(false);
  });
});
