import React, { useState } from "react";
import { ProductList } from "./ProductList";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Card } from "@shopify/polaris";

export function PriceUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const app = useAppBridge();

  const handleUpdatePrices = async (
    selectedProducts,
    priceUpdates,
    products
  ) => {
    if (selectedProducts.size === 0) {
      app.toast.show("Please select at least one product");
      return;
    }

    setIsUpdating(true);
    try {
      const updates = Array.from(selectedProducts).flatMap((productId) => {
        const product = products.find((p) => p.id === productId);
        return product.variants.map((variant) => ({
          productId: productId,
          variantId: variant.id,
          price: priceUpdates[variant.id] || variant.price,
        }));
      });

      const response = await fetch("/api/bulk-update-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.details
          ? `Some updates failed: ${result.details
              .map((e) => e.productTitle)
              .join(", ")}`
          : "Failed to update prices";
        throw new Error(errorMessage);
      }

      const successMessage = `Successfully updated ${result.updates.length} product(s)`;
      app.toast.show(successMessage);
    } catch (error) {
      console.error("Error updating prices:", error);
      app.toast.show(error.message || "Failed to update prices", {
        isError: true,
      });
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
