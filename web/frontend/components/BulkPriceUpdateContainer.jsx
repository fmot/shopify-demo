import React, { useState, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Card, TextContainer, Text, Modal } from "@shopify/polaris";
import { BulkPriceUpdateForm } from "./BulkPriceUpdateForm";
import { useQuery, useQueryClient } from "react-query";

const MAX_PRICE = 999999.99;

export function BulkPriceUpdateContainer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [priceUpdates, setPriceUpdates] = useState({});
  const [priceErrors, setPriceErrors] = useState({});
  const app = useAppBridge();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery("products", async () => {
    const response = await fetch("/api/get-products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  });

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
    setSelectedProducts(new Set());
    setPriceUpdates({});
    setPriceErrors({});
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleProductSelect = useCallback((productId, selected) => {
    setSelectedProducts((prev) => {
      const newSelected = new Set(prev);
      if (selected) {
        newSelected.add(productId);
      } else {
        newSelected.delete(productId);
      }
      return newSelected;
    });
  }, []);

  const handlePriceChange = useCallback((variantId, value) => {
    if (value === "") {
      setPriceUpdates((prev) => ({ ...prev, [variantId]: value }));
      setPriceErrors((prev) => ({ ...prev, [variantId]: null }));
      return;
    }

    const parsed = parseFloat(value);
    const regex = /^\d+(\.\d{0,2})?$/;

    if (
      isNaN(parsed) ||
      parsed < 0 ||
      parsed > MAX_PRICE ||
      !regex.test(value)
    ) {
      setPriceErrors((prev) => ({
        ...prev,
        [variantId]: "Please input a valid price",
      }));
    } else {
      setPriceErrors((prev) => ({ ...prev, [variantId]: null }));
    }
    setPriceUpdates((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  }, []);

  const isFormValid = useCallback(() => {
    const selectedVariantErrors = Array.from(selectedProducts).flatMap(
      (productId) => {
        const product = products?.find((p) => p.id === productId);
        if (!product) return [];
        return product.variants.map((variant) => priceErrors[variant.id]);
      }
    );

    return selectedVariantErrors.every((error) => !error);
  }, [selectedProducts, products, priceErrors]);

  const handleUpdatePrices = async () => {
    if (selectedProducts.size === 0) {
      app.toast.show("Please select at least one product");
      return;
    }
    if (!isFormValid()) {
      app.toast.show("Please correct the errors before saving changes", {
        isError: true,
      });
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
        throw new Error(result.error || "Failed to update prices");
      }

      await queryClient.invalidateQueries("products");

      app.toast.show(
        `Successfully updated ${result.updates?.length || "all"} product(s)`
      );
      handleModalClose();
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
    <>
      <Card
        title="Let's update some prices!"
        sectioned
        primaryFooterAction={{
          content: "Update Product Prices",
          onAction: handleModalOpen,
          disabled: isLoading,
        }}
      >
        <TextContainer spacing="loose">
          <Text as="p">
            You can update prices for multiple products at once. Select the
            products you want to modify and input new prices. *Maximum price is
            ${MAX_PRICE}
          </Text>
        </TextContainer>
      </Card>
      <Modal
        open={isModalOpen}
        onClose={handleModalClose}
        title="Update Product Prices"
        primaryAction={{
          content: "Save Changes",
          onAction: handleUpdatePrices,
          loading: isUpdating,
          disabled: selectedProducts.size === 0 || !isFormValid(),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose,
          },
        ]}
        large
      >
        <Modal.Section>
          <BulkPriceUpdateForm
            products={products}
            isLoading={isLoading}
            selectedProducts={selectedProducts}
            priceUpdates={priceUpdates}
            priceErrors={priceErrors}
            onProductSelect={handleProductSelect}
            onPriceChange={handlePriceChange}
          />
        </Modal.Section>
      </Modal>
    </>
  );
}
