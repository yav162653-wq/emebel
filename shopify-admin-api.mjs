import { log } from "node:console";
import process from "node:process";
import { requestShopifyAdmin } from "./script/shopify-admin-client.mjs";

const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const [bodyJson, path, retrySafeMutationArg] = process.argv.slice(2);

function printError(code, message, status) {
  log(JSON.stringify({
    errors: [{ message, extensions: { code } }],
    httpStatus: status,
  }, null, 2));
  process.exitCode = 1;
}

if (!shopDomain || !accessToken) {
  printError(
    "SHOPIFY_NOT_CONFIGURED",
    "Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN",
  );
} else if (!bodyJson) {
  log("Usage: node shopify-admin-api.mjs '{\"query\":\"query { shop { name } }\"}' [path]");
} else {
  try {
    const body = JSON.parse(bodyJson);
    const result = await requestShopifyAdmin({
      shopDomain,
      accessToken,
      body,
      path,
      retrySafeMutation: retrySafeMutationArg === "true",
    });
    log(JSON.stringify(result, null, 2));
  } catch (error) {
    printError(
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "SHOPIFY_REQUEST_FAILED",
      error instanceof Error ? error.message : "Shopify Admin API request failed",
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : undefined,
    );
  }
}
