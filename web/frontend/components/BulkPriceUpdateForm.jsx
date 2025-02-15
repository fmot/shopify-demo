import React, { useState } from "react";
import {
  ResourceList,
  ResourceItem,
  TextField,
  Checkbox,
  Stack,
  Spinner,
  Collapsible,
  Button,
  TextStyle,
  Card,
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
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  if (isLoading) return <Spinner />;

  const toggleProduct = (productId) => {
    setExpandedProducts((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(productId)) {
        newExpanded.delete(productId);
      } else {
        newExpanded.add(productId);
      }
      return newExpanded;
    });
  };

  return (
    <ResourceList
      items={products}
      renderItem={(product) => (
        <ResourceItem id={product.id}>
          <Stack vertical spacing="tight">
            <Stack distribution="equalSpacing" alignment="center">
              <Stack.Item>
                <Stack spacing="tight" alignment="center">
                  <Checkbox
                    label={product.title}
                    labelHidden
                    checked={selectedProducts.has(product.id)}
                    onChange={(checked) => onProductSelect(product.id, checked)}
                  />
                  <TextStyle variation="strong">{product.title}</TextStyle>
                </Stack>
              </Stack.Item>
              <Stack.Item>
                <Button
                  plain
                  onClick={() => toggleProduct(product.id)}
                  ariaExpanded={expandedProducts.has(product.id)}
                  ariaControls={`variants-${product.id}`}
                >
                  {expandedProducts.has(product.id) ? "Fold all" : "Expand all"}
                </Button>
              </Stack.Item>
            </Stack>

            <Collapsible
              open={expandedProducts.has(product.id)}
              id={`variants-${product.id}`}
            >
              <Card subdued>
                <Card.Section>
                  <Stack vertical spacing="tight">
                    {product.variants.map((variant, index) => (
                      <Stack
                        key={variant.id}
                        distribution="equalSpacing"
                        alignment="center"
                      >
                        <Stack.Item>
                          <TextStyle>{variant.title}</TextStyle>
                        </Stack.Item>
                        <Stack.Item>
                          <TextField
                            label={`Variant ${index + 1} Price`}
                            labelHidden
                            type="number"
                            value={priceUpdates[variant.id] || variant.price}
                            onChange={(value) =>
                              onPriceChange(variant.id, value)
                            }
                            suffix="CAD"
                            autoComplete="off"
                            error={priceErrors[variant.id]}
                          />
                        </Stack.Item>
                      </Stack>
                    ))}
                  </Stack>
                </Card.Section>
              </Card>
            </Collapsible>
          </Stack>
        </ResourceItem>
      )}
    />
  );
}
