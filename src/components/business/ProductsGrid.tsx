
import { productImageAlt } from "@/lib/imageAlt";
import React, { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { toast } from "sonner";
import ProductEditForm from "./ProductEditForm";
import { 
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { deleteProduct, updateProductStoreSettings } from "@/services/productsService";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { isLocationPriced, STORES, type StoreId } from "@/lib/stores";

interface ProductsGridProps {
  products: Product[];
  onProductsChanged: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({ products, onProductsChanged }) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteProduct(productToDelete.id);
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    
    if (success) {
      toast.success(`${productToDelete.name} deleted successfully`);
      onProductsChanged();
    } else {
      toast.error(`Failed to delete ${productToDelete.name}`);
    }
  };

  // Flip available/sold out for one store and save immediately.
  const toggleSoldOut = async (product: Product, store: StoreId, available: boolean) => {
    const field = store === "bronx" ? "sold_out_bronx" : "sold_out_manhattan";
    const ok = await updateProductStoreSettings(product.id, { [field]: !available });
    if (ok) {
      toast.success(`${product.name} ${available ? "available" : "sold out"} at ${store === "bronx" ? "Bronx" : "Manhattan"}`);
      onProductsChanged();
    } else toast.error("Could not update availability");
  };

  // Save a store-specific price for smoothies/juices (blank = use base price).
  const saveStorePrice = async (product: Product, store: StoreId, value: string) => {
    const num = value.trim() === "" ? null : Number(value);
    if (num !== null && (isNaN(num) || num < 0)) return toast.error("Enter a valid price");
    const field = store === "bronx" ? "price_bronx" : "price_manhattan";
    const current = store === "bronx" ? product.priceBronx : product.priceManhattan;
    if ((current ?? null) === num) return;
    const ok = await updateProductStoreSettings(product.id, { [field]: num });
    if (ok) {
      toast.success(`${product.name} price updated`);
      onProductsChanged();
    } else toast.error("Could not update price");
  };

  if (products.length === 0) {
    return <div className="text-gray-500 py-8 text-center">No products created yet.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4 relative">
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEdit(product)}
                title="Edit product"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(product)}
                className="text-red-500"
                title="Delete product"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            
            <h4 className="font-semibold text-md mb-2 pr-16">{product.name}</h4>
            <div className="mb-2">
              <img src={product.image} alt={productImageAlt(product.name, product.category)} className="w-full h-32 object-cover rounded" />
            </div>
            <div className="text-xs text-gray-600 mb-2">{product.category}</div>
            <div className="font-bold mb-2">${product.price?.toFixed(2)}</div>
            <div className="text-gray-700 text-sm mb-3">{product.description}</div>
            <div className="border-t pt-3 space-y-2">
              {STORES.map((st) => {
                const soldOut = st.id === "bronx" ? product.soldOutBronx : product.soldOutManhattan;
                const storePrice = st.id === "bronx" ? product.priceBronx : product.priceManhattan;
                return (
                  <div key={st.id} className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={!soldOut}
                        onCheckedChange={(v) => toggleSoldOut(product, st.id, v)}
                        aria-label={`${product.name} available at ${st.label}`}
                      />
                      <span>
                        {st.label}: <strong>{soldOut ? "Sold out" : "Available"}</strong>
                      </span>
                    </label>
                    {isLocationPriced(product.category) && (
                      <Input
                        key={`${product.id}-${st.id}-${storePrice ?? ""}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={storePrice ?? ""}
                        placeholder={product.price.toFixed(2)}
                        aria-label={`${product.name} price at ${st.label}`}
                        className="w-20 h-8 text-sm"
                        onBlur={(e) => saveStorePrice(product, st.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <ProductEditForm
          product={editingProduct}
          onProductUpdated={onProductsChanged}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {productToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsGrid;
