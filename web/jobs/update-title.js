import cron from "node-cron";
import shopify from "../shopify.js";
import fetch from "node-fetch";

export function UpdateTitle() {
  cron.schedule("* * * * *", async () => {
    console.log("[CRON] Starting product title update job...");

    const shopDomain = process.env.SHOP_DOMAIN;
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
      const response = await fetch(
        `${process.env.HOST}/api/get-products-for-updating-title`
      );
      if (!response.ok) {
        console.error(
          "[CRON] Failed to fetch products. Status:",
          response.status
        );
        return;
      }
      const products = await response.json();

      for (const [index, product] of products.entries()) {
        const productId = product.id;

        const dateOptions = {
          timeZone: "America/Vancouver",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        };

        const timeOptions = {
          timeZone: "America/Vancouver",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };

        const now = new Date();

        const formattedDate = new Intl.DateTimeFormat(
          "en-CA",
          dateOptions
        ).format(now);
        const formattedTime = new Intl.DateTimeFormat(
          "en-CA",
          timeOptions
        ).format(now);
        const newTitle = `T-shirt${
          index + 1
        } ${formattedDate} ${formattedTime}`;

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
