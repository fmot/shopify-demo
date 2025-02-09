// import { useState } from "react";
// import {
//   Card,
//   TextField,
//   Button,
//   TextContainer,
//   Text,
//   Banner,
//   Stack,
// } from "@shopify/polaris";
// import { useAppBridge } from "@shopify/app-bridge-react";
// import { useMutation } from "react-query";

// export function PriceUpdateForm() {
//   const shopify = useAppBridge();
//   const [productId, setProductId] = useState("");
//   const [variantId, setVariantId] = useState("");
//   const [price, setPrice] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");

//   const updatePriceMutation = useMutation(
//     async (data) => {
//       const response = await fetch("/api/update-price", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.error || "Failed to update price");
//       }

//       return response.json();
//     },
//     {
//       onSuccess: () => {
//         setProductId("");
//         setVariantId("");
//         setPrice("");

//         shopify.toast.show("Price successfully updated");
//       },
//       onError: (error) => {
//         setErrorMessage(error.message);
//         shopify.toast.show(error.message, { isError: true });
//       },
//     }
//   );

//   const handleUpdatePrice = () => {
//     setErrorMessage("");
//     updatePriceMutation.mutate({ productId, variantId, price });
//   };

//   const isFormValid = productId && variantId && price;

//   return (
//     <Card sectioned title="Update Product Price">
//       <Stack vertical spacing="loose">
//         {errorMessage && (
//           <Banner status="critical">
//             <p>{errorMessage}</p>
//           </Banner>
//         )}

//         <TextContainer>
//           <Text as="p" variant="bodyMd">
//             Enter the Product and Variant IDs, then set the new price.
//           </Text>
//         </TextContainer>

//         <Stack vertical spacing="tight">
//           <TextField
//             label="Product ID"
//             value={productId}
//             onChange={setProductId}
//             placeholder="gid://shopify/Product/123456789"
//             error={
//               !productId && updatePriceMutation.isError
//                 ? "Product ID is required"
//                 : undefined
//             }
//             autoComplete="off"
//             helpText="Enter the Shopify Product ID (starts with gid://shopify/Product/)"
//           />

//           <TextField
//             label="Variant ID"
//             value={variantId}
//             onChange={setVariantId}
//             placeholder="gid://shopify/ProductVariant/1234567890"
//             error={
//               !variantId && updatePriceMutation.isError
//                 ? "Variant ID is required"
//                 : undefined
//             }
//             autoComplete="off"
//             helpText="Enter the Shopify Variant ID (starts with gid://shopify/ProductVariant/)"
//           />

//           <TextField
//             label="New Price"
//             value={price}
//             onChange={setPrice}
//             type="number"
//             placeholder="12.34"
//             error={
//               !price && updatePriceMutation.isError
//                 ? "Price is required"
//                 : undefined
//             }
//             suffix="CAD"
//             autoComplete="off"
//             helpText="Enter the new price in CAD"
//           />
//         </Stack>

//         <Stack distribution="trailing">
//           <Button
//             primary
//             onClick={handleUpdatePrice}
//             loading={updatePriceMutation.isLoading}
//             disabled={!isFormValid || updatePriceMutation.isLoading}
//           >
//             Update Price
//           </Button>
//         </Stack>
//       </Stack>
//     </Card>
//   );
// }
