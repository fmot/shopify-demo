import React from "react";
import {
  ResourceList,
  ResourceItem,
  TextField,
  Checkbox,
  Stack,
  Spinner,
} from "@shopify/polaris";

export function BulkPriceUpdateForm({
  products,
  isLoading,
  selectedProducts,
  priceUpdates,
  priceErrors,
  onProductSelect,
  onPriceChange,
}) {
  if (isLoading) return <Spinner />;

  return (
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
                onChange={(checked) => onProductSelect(product.id, checked)}
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
                  onChange={(value) => onPriceChange(variant.id, value)}
                  suffix="CAD"
                  autoComplete="off"
                  error={priceErrors[variant.id]}
                />
              ))}
            </Stack.Item>
          </Stack>
        </ResourceItem>
      )}
    />
  );
}
