
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { products as localProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchProducts } from "@/services/productsService";

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const currentCategory = searchParams.get("category") || "all";
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products from Supabase on mount; ignore stale updates if the component unmounts.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchProducts().then((fetched) => {
      if (mounted) {
        setDbProducts(fetched);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Merge DB products and hardcoded only if db is empty (fallback to old)
  const allProducts = (dbProducts.length > 0 ? dbProducts : localProducts);

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(allProducts.map(p => p.category)))];

  // Filter products based on search term
  const filteredProducts = allProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ingredients.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Update the search term when the user types in the search input.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Return products for a specific category, or all filtered products for the "all" tab.
  const getCategoryProducts = (category: string) => {
    if (category === "all") {
      return filteredProducts;
    }
    return filteredProducts.filter(p => p.category === category);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-muted/40 border-b border-border py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <span className="text-[11px] tracking-[0.35em] text-muted-foreground uppercase">The Menu</span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl mt-3 mb-5 text-foreground break-words">EVERY SIP, INTENTIONAL.</h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Cold-pressed juices and small-batch smoothies — made fresh every day.
          </p>
          <div className="relative max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search the menu..."
              className="pl-10 py-6 rounded-full bg-background border-border"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : (
        <Tabs
          value={currentCategory}
          onValueChange={(val) => {
            const next = new URLSearchParams(searchParams);
            if (val === "all") next.delete("category");
            else next.set("category", val);
            setSearchParams(next, { replace: true });
          }}
          className="w-full"
        >
          <div className="mb-8 -mx-4 px-4 overflow-x-auto md:mx-0 md:px-0 md:flex md:justify-center">
            <TabsList className="h-auto p-1 w-max md:w-auto md:flex-wrap">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="px-4 py-2 capitalize"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              {getCategoryProducts(category).length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-2xl font-semibold mb-2">No juices found</h3>
                  <p className="text-gray-500">Try a different search term</p>
                </div>
              ) : category === "all" ? (
                <div className="space-y-16">
                  {categories
                    .filter((c) => c !== "all")
                    .map((c) => {
                      const items = getCategoryProducts(c);
                      if (items.length === 0) return null;
                      return (
                        <div key={c}>
                          <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-4">
                            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-foreground uppercase">
                              {c}
                              {c.toLowerCase().endsWith("s") ? "" : "s"}
                            </h2>
                            <span className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                              {items.length} {items.length === 1 ? "item" : "items"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getCategoryProducts(category).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        )}
      </section>
    </Layout>
  );
};

export default Menu;
