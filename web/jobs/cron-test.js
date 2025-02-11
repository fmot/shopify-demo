import cron from "node-cron";
import shopify from "../shopify.js";

export function TestCron() {
  cron.schedule("* * * * *", async () => {
    console.log("[CRON] Starting price update job...");

    const shopDomain = "fumiya-shop.myshopify.com";
    const sessionId = shopify.api.session.getOfflineId(shopDomain);
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    if (!session) {
      console.warn("[CRON] No offline session found for shop:", shopDomain);
      return;
    }

    try {
      const client = new shopify.api.clients.Graphql({ session });

      const productId = "gid://shopify/Product/8671883034798";

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
      const newTitle = `Cron Updated Title ${new Date().toISOString()}`;

      const response = await client.query({
        data: {
          query: mutationQuery,
          variables: {
            id: productId,
            title: newTitle,
          },
        },
      });

      console.log("[CRON] Mutation response:", response.body.data);
    } catch (error) {
      console.error("[CRON] Error during price update:", error);
    }
  });
}
