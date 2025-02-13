import cron from "node-cron";
import shopify from "../shopify.js";
import fetch from "node-fetch";

export function UpdateTitle() {
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Starting product title update job...");

    const shopDomain = "fumiya-shop.myshopify.com";
    const sessionId = shopify.api.session.getOfflineId(shopDomain);
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    if (!session) {
      console.warn("[CRON] No session found for shop:", shopDomain);
      return;
    }

    const client = new shopify.api.clients.Graphql({ session });

    const mutationQuery = `
      mutation updateProduct($id: ID!, $title: String!) {
        productUpdate(input: { id: $id, title: $title }) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response = await fetch(`${process.env.BASE_URL}/api/get-products`);
      if (!response.ok) {
        console.error(
          "[CRON] Failed to fetch products. Status:",
          response.status
        );
        return;
      }
      const products = await response.json();

      for (const product of products) {
        const productId = product.id;
        const newTitle = `Updated Title ${new Date().toISOString()}`;

        try {
          const mutationResponse = await client.query({
            data: {
              query: mutationQuery,
              variables: {
                id: productId,
                title: newTitle,
              },
            },
          });

          if (
            mutationResponse.body.data.productUpdate.userErrors &&
            mutationResponse.body.data.productUpdate.userErrors.length > 0
          ) {
            console.error(
              `[CRON] Failed to update product ${productId}:`,
              mutationResponse.body.data.productUpdate.userErrors
            );
          } else {
            console.log(
              `[CRON] Successfully updated product ${productId}:`,
              mutationResponse.body.data.productUpdate.product
            );
          }
        } catch (mutationError) {
          console.error(
            `[CRON] Error updating product ${productId}:`,
            mutationError
          );
        }
      }
    } catch (error) {
      console.error("[CRON] Error fetching products:", error);
    }
  });
}
