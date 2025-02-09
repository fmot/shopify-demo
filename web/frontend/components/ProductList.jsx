import React, { useState } from "react";
import { useQuery } from "react-query";
import {
  ResourceList,
  ResourceItem,
  TextField,
  Checkbox,
  Stack,
  Spinner,
  Button,
} from "@shopify/polaris";

export function ProductList({ onUpdatePrices, isUpdating }) {
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [priceUpdates, setPriceUpdates] = useState({});

  const { data: products, isLoading } = useQuery("products", async () => {
    const response = await fetch("/api/get-products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  });

  const handleUpdatePrices = () => {
    onUpdatePrices(selectedProducts, priceUpdates, products);
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <ResourceList
        items={products}
        renderItem={(product) => (
          <ResourceItem id={product.id}>
            <Stack distribution="equalSpacing" alignment="center">
              <Checkbox
                label={product.title}
                labelHidden
                checked={selectedProducts.has(product.id)}
                onChange={(checked) => {
                  const newSelected = new Set(selectedProducts);
                  if (checked) {
                    newSelected.add(product.id);
                  } else {
                    newSelected.delete(product.id);
                  }
                  setSelectedProducts(newSelected);
                }}
              />
              <div>{product.title}</div>
              <TextField
                label="Price"
                labelHidden
                type="number"
                value={priceUpdates[product.id] || product.variants[0].price}
                onChange={(value) =>
                  setPriceUpdates((prev) => ({
                    ...prev,
                    [product.id]: value,
                  }))
                }
                suffix="CAD"
                autoComplete="off"
              />
            </Stack>
          </ResourceItem>
        )}
      />
      <Button primary onClick={handleUpdatePrices} loading={isUpdating}>
        Update Selected Prices
      </Button>
    </>
  );
}
