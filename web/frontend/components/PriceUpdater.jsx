import React, { useState } from "react";
import { ProductList } from "./ProductList";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Card } from "@shopify/polaris";

export function PriceUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const shopify = useAppBridge();

  const handleUpdatePrices = async (
    selectedProducts,
    priceUpdates,
    products
  ) => {
    if (selectedProducts.size === 0) {
      shopify.toast.show("Please select at least one product", {
        isError: true,
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updates = Array.from(selectedProducts).map((productId) => {
        const product = products.find((p) => p.id === productId);
        return {
          productId,
          variantId: product.variants[0].id,
          price: priceUpdates[productId] || product.variants[0].price,
        };
      });

      const response = await fetch("/api/bulk-update-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prices");
      }

      shopify.toast.show("Prices updated successfully");
    } catch (error) {
      console.error("Error updating prices:", error);
      shopify.toast.show("Failed to update prices", { isError: true });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card title="Price Updater">
      <ProductList
        onUpdatePrices={handleUpdatePrices}
        isUpdating={isUpdating}
      />
    </Card>
  );
}
