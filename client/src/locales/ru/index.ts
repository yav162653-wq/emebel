import account from "./account";
import admin from "./admin";
import auth from "./auth";
import cart from "./cart";
import checkout from "./checkout";
import common from "./common";
import landing from "./landing";
import product from "./product";
import shop from "./shop";
import wishlist from "./wishlist";

const translations = {
  ...common,
  ...auth,
  ...product,
  ...shop,
  ...cart,
  ...checkout,
  ...account,
  ...wishlist,
  ...landing,
  ...admin,
} satisfies typeof import("../en/index").default;

export default translations;
