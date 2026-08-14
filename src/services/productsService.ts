
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types";

// Resolve "/src/assets/foo.webp" paths stored in the DB to bundled asset URLs.
const assetModules = import.meta.glob("/src/assets/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function resolveImage(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/src/assets/")) {
    return assetModules[url] ?? url;
  }
  return url;
}

/**
 * Fetch all products from Supabase
 */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Convert db row to Product type
  const products = (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: parseFloat(row.price.toString()), // Convert price to number
    image: resolveImage(row.image_url),
    category: row.category ?? "other",
    ingredients: [], // Could be extended in schema
    benefits: [], // Could be extended in schema
    isShippable: (row as { is_shippable?: boolean }).is_shippable ?? false,
  }));

  // Cold-pressed juices are numbered on the bottle — display in that order.
  const coldPressedOrder: Record<string, number> = {
    "kick off": 1,
    "just beet it": 2,
    "watch me work": 3,
    "snatched af": 4,
    "blue majik": 5,
    "orange you happy": 6,
  };
  products.sort((a, b) => {
    if (a.category === "cold-pressed juice" && b.category === "cold-pressed juice") {
      return (
        (coldPressedOrder[a.name.toLowerCase()] ?? 99) -
        (coldPressedOrder[b.name.toLowerCase()] ?? 99)
      );
    }
    return 0;
  });
  return products;
}

/**
 * Insert a new product (business owner only)
 */
export async function createProduct(product: Omit<Product, "id">): Promise<boolean> {
  const { name, description, price, image, category, ingredients, benefits } = product;
  const { error } = await supabase
    .from("products")
    .insert({
      name,
      description,
      price, // Keep as number - don't convert to string
      image_url: image,
      category,
      // Could be extended to save ingredients/benefits as JSON in db
    });
  if (error) {
    console.error("Error creating product:", error);
    return false;
  }
  return true;
}

/**
 * Update an existing product
 */
export async function updateProduct(product: Product): Promise<boolean> {
  const { id, name, description, price, image, category } = product;
  const { error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      image_url: image,
      category,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);
  
  if (error) {
    console.error("Error updating product:", error);
    return false;
  }
  return true;
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);
  
  if (error) {
    console.error("Error deleting product:", error);
    return false;
  }
  return true;
}
