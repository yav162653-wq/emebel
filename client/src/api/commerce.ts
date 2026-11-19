import { api, type OrderListResponse, type ShopifyCheckoutInput, type ShopifyCheckoutResponse } from "@shared/routes";
import { apiFetchJson, apiRequestJson } from "./http";

export async function fetchMyOrders(): Promise<OrderListResponse> {
  return apiFetchJson(api.orders.list.path, api.orders.list.responses[200]);
};

export async function createShopifyCheckout(
  input: ShopifyCheckoutInput,
): Promise<ShopifyCheckoutResponse> {
  const parsedInput = api.shopify.checkout.input.parse(input);
  return apiRequestJson(
    api.shopify.checkout.method,
    api.shopify.checkout.path,
    parsedInput,
    api.shopify.checkout.responses[200],
  );
}
