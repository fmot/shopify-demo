// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import { UpdateTitle } from "./jobs/update-title.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

// for online session
// app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// app.post("/api/update-price", async (req, res) => {
//   console.log("Received request body:", req.body);

//   const { productId, variantId, price } = req.body;

//   if (!productId || !variantId || !price) {
//     return res
//       .status(400)
//       .send({ error: "すべてのフィールドを入力してください。" });
//   }

//   try {
//     const client = new shopify.api.clients.Graphql({
//       session: res.locals.shopify.session,
//     });

//     console.log("Session Data:", res.locals.shopify.session);

//     const response = await client.query({
//       data: {
//         query: `
//           mutation variantsToBulkUpdate($productId: ID!, $variantsToBulkUpdate: [ProductVariantsBulkInput!]!) {
//             productVariantsBulkUpdate(
//               productId: $productId
//               variants: $variantsToBulkUpdate
//             ) {
//               userErrors {
//                 field
//                 message
//               }
//               product {
//                 id
//               }
//             }
//           }
//         `,
//         variables: {
//           productId: productId,
//           variantsToBulkUpdate: [
//             {
//               id: variantId,
//               price: price.toString(),
//             },
//           ],
//         },
//       },
//     });

//     console.log("GraphQL Response:", response.body);

//     res.status(200).send({
//       success: true,
//       product: response.body.data.productVariantsBulkUpdate.product,
//     });
//   } catch (error) {
//     if (error.response && error.response.body) {
//       console.error(
//         "GraphQL Error Details:",
//         JSON.stringify(error.response.body, null, 2)
//       );
//     } else {
//       console.error("Error:", error);
//     }
//     res.status(500).send({ error: "サーバーエラーが発生しました。" });
//   }
// });

app.get("/api/get-products", async (_req, res) => {
  try {
    const shopDomain = "fumiya-shop.myshopify.com";
    const sessionId = shopify.api.session.getOfflineId(shopDomain);
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    if (!session) {
      return res
        .status(403)
        .send({ error: "No offline session found for this shop" });
    }

    const client = new shopify.api.clients.Graphql({ session });

    const response = await client.query({
      data: {
        query: `
          query {
            products(first: 50) {
              nodes {
                id
                title
                variants(first: 1) {
                  nodes {
                    id
                    price
                  }
                }
              }
            }
          }
        `,
      },
    });

    const products = response.body.data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      variants: product.variants.nodes,
    }));

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ error: "Failed to fetch products" });
  }
});

app.post("/api/bulk-update-prices", async (req, res) => {
  const { updates } = req.body;
  console.log("Received bulk update request:", updates);

  try {
    const shopDomain = "fumiya-shop.myshopify.com";
    const sessionId = shopify.api.session.getOfflineId(shopDomain);
    const session = await shopify.config.sessionStorage.loadSession(sessionId);

    if (!session) {
      return res
        .status(403)
        .send({ error: "No offline session found for this shop" });
    }

    const client = new shopify.api.clients.Graphql({ session });

    const updatesByProduct = updates.reduce((acc, update) => {
      if (!acc[update.productId]) {
        acc[update.productId] = [];
      }
      acc[update.productId].push({
        id: update.variantId,
        price: update.price.toString(),
      });
      return acc;
    }, {});

    console.log("updatesByProduct:", updatesByProduct);

    const updatePromises = Object.entries(updatesByProduct).map(
      ([productId, variants]) => {
        return client.query({
          data: {
            query: `
            mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                product {
                  id
                  title
                }
                productVariants {
                  id
                  price
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
            variables: {
              productId: productId,
              variants: variants,
            },
          },
        });
      }
    );

    const results = await Promise.all(updatePromises);

    const errors = [];
    const successfulUpdates = [];

    results.forEach((response) => {
      const result = response.body.data.productVariantsBulkUpdate;
      if (result.userErrors && result.userErrors.length > 0) {
        errors.push({
          productId: result.product.id,
          productTitle: result.product.title,
          errors: result.userErrors,
        });
      } else {
        successfulUpdates.push({
          productId: result.product.id,
          productTitle: result.product.title,
          variants: result.productVariants,
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Some price updates failed",
        details: errors,
        successfulUpdates,
      });
    }

    res.status(200).json({
      success: true,
      updates: successfulUpdates,
    });
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).json({ error: "Failed to update prices" });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

UpdateTitle();

app.listen(PORT);
