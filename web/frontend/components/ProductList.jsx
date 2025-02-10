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
              <Stack.Item>
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
              </Stack.Item>
              <Stack.Item>
                <div>{product.title}</div>
              </Stack.Item>
              <Stack.Item>
                {product.variants.map((variant, index) => (
                  <TextField
                    key={variant.id}
                    label={`Variant ${index + 1} Price`}
                    labelHidden
                    type="number"
                    value={priceUpdates[variant.id] || variant.price}
                    onChange={(value) =>
                      setPriceUpdates((prev) => ({
                        ...prev,
                        [variant.id]: value,
                      }))
                    }
                    suffix="CAD"
                    autoComplete="off"
                  />
                ))}
              </Stack.Item>
            </Stack>
          </ResourceItem>
        )}
      />
      <div>
        <Button
          primary
          onClick={handleUpdatePrices}
          loading={isUpdating}
          disabled={selectedProducts.size === 0}
        >
          Update Selected Prices ({selectedProducts.size} products)
        </Button>
      </div>
    </>
  );
}
