# Shopify Development-Store Verification

Use a dedicated Shopify development store and app credentials. Never run these
steps with a production store or token. Catalog synchronization changes Shopify
products, prices, inventory, and publication state.

## Preparation

1. Create a development store and a dedicated custom app with only the Admin and
   Storefront scopes required by the integration.
2. Set `SHOPIFY_SHOP_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, and
   `SHOPIFY_ADMIN_ACCESS_TOKEN` in an ignored local environment file or secret
   manager. Do not copy credentials into test code or logs.
3. Use a disposable local PostgreSQL database containing the products to sync.
   `SHOPIFY_SYNC_NAMES` can restrict the catalog script to selected product
   names; leave it unset only when the development store is disposable.

## Verify without a purchase

1. Run the existing mocked suite: `npx tsx --test server/config/shopifyStorefrontClient.test.ts script/shopify-admin-client.test.mjs`.
   These tests make no Shopify network requests.
2. Start the app against the development store and verify product details,
   availability, prices, and currency through the storefront integration.
3. Create a test cart and confirm the hosted checkout URL belongs to the
   development store. Stop before submitting payment or placing an order.
4. If testing Admin synchronization, run
   `npx tsx script/sync-shopify-catalog.ts` only after confirming the configured
   domain is the development store. Review products, inventory, prices, and
   publication state in that store.
5. Revoke test app credentials when finished and remove disposable test data.

Do not treat the mocked suite as proof of live provider availability. Record
the store, app version, tested scopes, and result, but never record tokens.
