import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import Redis from "ioredis";
import { RedisSessionStorage } from "@shopify/shopify-app-session-storage-redis";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

let sessionStorage;

if (process.env.NODE_ENV === "production") {
  const redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    tls: {
      rejectUnauthorized: false,
    },
  });
  sessionStorage = new RedisSessionStorage(redisClient);
  console.log("Using Redis for session storage");
} else {
  sessionStorage = new SQLiteSessionStorage(DB_PATH);
  console.log("Using SQLite for session storage");
}

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
    isOnline: false,
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage,
});

export default shopify;
