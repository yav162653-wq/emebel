const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const [bodyJson, pathArg] = process.argv.slice(2);
const path = pathArg || "/admin/api/2026-04/graphql.json";

if (!shopDomain || !adminToken) {
  console.log("Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN.");
  process.exit(1);
}

if (!bodyJson) {
  console.log("Usage: node shopify-admin-api.mjs '{\"query\":\"query { shop { name } }\"}' [path]");
  process.exit(0);
}

const resp = await fetch(`https://${shopDomain}${path}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": adminToken,
  },
  body: bodyJson,
  signal: AbortSignal.timeout(30_000),
});

const text = await resp.text();
let parsed = null;
try {
  parsed = JSON.parse(text);
  console.log(JSON.stringify(parsed, null, 2));
} catch {
  console.log(text);
}

function hasUserErrors(node) {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) return node.some(hasUserErrors);
  if (Array.isArray(node.userErrors) && node.userErrors.length > 0) return true;
  for (const value of Object.values(node)) {
    if (hasUserErrors(value)) return true;
  }
  return false;
}

const hasTopLevelErrors =
  parsed && Array.isArray(parsed.errors) && parsed.errors.length > 0;
const hasMutationUserErrors = parsed && hasUserErrors(parsed.data);

if (!resp.ok || hasTopLevelErrors || hasMutationUserErrors) {
  process.exitCode = 1;
}